import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";

const INCREASING_TYPES = new Set(["DEPOSIT"]);
const DECREASING_TYPES = new Set(["WITHDRAWAL", "SERVICE_CHARGE"]);

export const INSUFFICIENT_BALANCE_MESSAGE = "This would make the account balance negative. Not enough funds available.";

// A transaction can only be corrected within this long of being recorded — mirrors
// EDIT_REFUND_WINDOW_MS in sales.service.js, measured from createdAt (when it was actually
// entered) rather than its own `date` field (which the user can backdate), since the point
// is "how long do you have to fix a mistake you just made."
const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

const ACCOUNT_SELECT = { id: true, name: true, bankName: true, accountNumber: true, balance: true, active: true, createdAt: true };

export async function listBankAccounts(organizationId) {
  return prisma.bankAccount.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    select: ACCOUNT_SELECT,
  });
}

export async function createBankAccount({ organizationId, name, bankName, accountNumber, openingBalance }) {
  return prisma.bankAccount.create({
    data: { organizationId, name, bankName: bankName || null, accountNumber: accountNumber || null, balance: openingBalance || 0 },
    select: ACCOUNT_SELECT,
  });
}

// Renaming/deactivating only — `balance` is never directly writable, it only ever changes
// through recordBankTransaction, same as StoreProduct.quantity only ever changes through
// applyInventoryChange.
export async function updateBankAccount({ organizationId, accountId, name, bankName, accountNumber, active }) {
  const existing = await prisma.bankAccount.findFirst({ where: { id: accountId, organizationId } });
  if (!existing) throw ApiError.notFound("Bank account not found");

  const data = {};
  if (name !== undefined) data.name = name;
  if (bankName !== undefined) data.bankName = bankName || null;
  if (accountNumber !== undefined) data.accountNumber = accountNumber || null;
  if (active !== undefined) data.active = active;

  return prisma.bankAccount.update({ where: { id: accountId }, data, select: ACCOUNT_SELECT });
}

// Only allowed once an account has no transaction history — BankTransaction cascades on
// delete, so deleting an account with real activity would silently wipe its ledger. An
// account that's actually been used should be deactivated (via updateBankAccount) instead,
// same convention as Store's active toggle.
export async function deleteBankAccount({ organizationId, accountId }) {
  const existing = await prisma.bankAccount.findFirst({ where: { id: accountId, organizationId } });
  if (!existing) throw ApiError.notFound("Bank account not found");

  const transactionCount = await prisma.bankTransaction.count({ where: { bankAccountId: accountId } });
  if (transactionCount > 0) {
    throw ApiError.badRequest(
      `This account has ${transactionCount} transaction${transactionCount === 1 ? "" : "s"} and can't be deleted — deactivate it instead to keep its history.`
    );
  }

  await prisma.bankAccount.delete({ where: { id: accountId } });
  return existing;
}

export async function listBankTransactions({ organizationId, accountId, skip, take }) {
  const account = await prisma.bankAccount.findFirst({ where: { id: accountId, organizationId } });
  if (!account) throw ApiError.notFound("Bank account not found");

  const [total, transactions] = await Promise.all([
    prisma.bankTransaction.count({ where: { bankAccountId: accountId } }),
    prisma.bankTransaction.findMany({
      where: { bankAccountId: accountId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
      skip,
      take,
    }),
  ]);

  return { transactions, total };
}

// Atomic balance update + audit row, mirroring applyInventoryChange exactly: the balance
// is written first via an increment, then checked for going negative — if it did, throwing
// here rolls back the whole transaction, so the negative value never actually persists.
export async function recordBankTransaction({ organizationId, accountId, userId, type, amount, date, description }) {
  const existing = await prisma.bankAccount.findFirst({ where: { id: accountId, organizationId } });
  if (!existing) throw ApiError.notFound("Bank account not found");
  if (!INCREASING_TYPES.has(type) && !DECREASING_TYPES.has(type)) throw ApiError.badRequest(`Unknown bank transaction type: ${type}`);

  return prisma.$transaction(async (tx) => {
    const delta = INCREASING_TYPES.has(type) ? amount : -amount;

    const account = await tx.bankAccount.update({
      where: { id: accountId },
      data: { balance: { increment: delta } },
    });

    const newBalance = Number(account.balance);
    const previousBalance = newBalance - delta;

    if (newBalance < 0) throw ApiError.badRequest(INSUFFICIENT_BALANCE_MESSAGE);

    return tx.bankTransaction.create({
      data: { bankAccountId: accountId, userId, type, amount, previousBalance, newBalance, date, description: description || null },
      include: { user: { select: { id: true, name: true } } },
    });
  });
}

// Corrects an existing transaction's type/amount/date/description within EDIT_WINDOW_MS of
// it being recorded, with a mandatory reason. The account balance is adjusted by the NET
// difference between the old and new effect in one atomic step (equivalent to reversing the
// old transaction and applying the new one, but keeping the same row/id and its real
// createdAt), still guarded against going negative.
export async function editBankTransaction({ organizationId, transactionId, userId, type, amount, date, description, reason }) {
  const existing = await prisma.bankTransaction.findFirst({
    where: { id: transactionId, bankAccount: { organizationId } },
  });
  if (!existing) throw ApiError.notFound("Bank transaction not found");
  if (!INCREASING_TYPES.has(type) && !DECREASING_TYPES.has(type)) throw ApiError.badRequest(`Unknown bank transaction type: ${type}`);

  if (Date.now() - existing.createdAt.getTime() > EDIT_WINDOW_MS) {
    throw ApiError.badRequest("This transaction was recorded more than 24 hours ago and can no longer be edited");
  }

  const oldDelta = INCREASING_TYPES.has(existing.type) ? Number(existing.amount) : -Number(existing.amount);
  const newDelta = INCREASING_TYPES.has(type) ? amount : -amount;
  const netDelta = newDelta - oldDelta;

  return prisma.$transaction(async (tx) => {
    const account = await tx.bankAccount.update({
      where: { id: existing.bankAccountId },
      data: { balance: { increment: netDelta } },
    });

    const newAccountBalance = Number(account.balance);
    if (newAccountBalance < 0) throw ApiError.badRequest(INSUFFICIENT_BALANCE_MESSAGE);
    const previousBalance = newAccountBalance - netDelta;

    return tx.bankTransaction.update({
      where: { id: transactionId },
      data: {
        type,
        amount,
        date,
        description: description || null,
        previousBalance,
        newBalance: newAccountBalance,
        editedAt: new Date(),
        editedById: userId,
        editReason: reason,
      },
      include: { user: { select: { id: true, name: true } } },
    });
  });
}

// Reverses the balance change and removes the audit row — same unrestricted correction
// pattern as deleteManualSaleEntry (no time window; this whole feature is already ADMIN-only).
export async function deleteBankTransaction({ organizationId, transactionId }) {
  const existing = await prisma.bankTransaction.findFirst({
    where: { id: transactionId, bankAccount: { organizationId } },
  });
  if (!existing) throw ApiError.notFound("Bank transaction not found");

  const delta = INCREASING_TYPES.has(existing.type) ? -Number(existing.amount) : Number(existing.amount);

  return prisma.$transaction(async (tx) => {
    const account = await tx.bankAccount.update({
      where: { id: existing.bankAccountId },
      data: { balance: { increment: delta } },
    });
    if (Number(account.balance) < 0) throw ApiError.badRequest(INSUFFICIENT_BALANCE_MESSAGE);

    await tx.bankTransaction.delete({ where: { id: transactionId } });
    return existing;
  });
}
