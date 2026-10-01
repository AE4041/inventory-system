import { asyncHandler } from "../utils/asyncHandler.js";
import { parsePagination, paginatedResponse } from "../utils/pagination.js";
import {
  listBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  listBankTransactions,
  recordBankTransaction,
  deleteBankTransaction,
} from "../services/bankAccount.service.js";

export const getBankAccounts = asyncHandler(async (req, res) => {
  const accounts = await listBankAccounts(req.user.organizationId);
  res.json({ success: true, data: accounts });
});

export const addBankAccount = asyncHandler(async (req, res) => {
  const account = await createBankAccount({ organizationId: req.user.organizationId, ...req.body });
  res.status(201).json({ success: true, data: account });
});

export const editBankAccount = asyncHandler(async (req, res) => {
  const account = await updateBankAccount({ organizationId: req.user.organizationId, accountId: req.params.id, ...req.body });
  res.json({ success: true, data: account });
});

export const removeBankAccount = asyncHandler(async (req, res) => {
  const account = await deleteBankAccount({ organizationId: req.user.organizationId, accountId: req.params.id });
  res.json({ success: true, data: { id: account.id } });
});

export const getBankTransactions = asyncHandler(async (req, res) => {
  const { page, pageSize, skip, take } = parsePagination(req.query);
  const { transactions, total } = await listBankTransactions({ organizationId: req.user.organizationId, accountId: req.params.id, skip, take });
  res.json({ success: true, ...paginatedResponse(transactions, total, page, pageSize) });
});

export const addBankTransaction = asyncHandler(async (req, res) => {
  const transaction = await recordBankTransaction({
    organizationId: req.user.organizationId,
    accountId: req.params.id,
    userId: req.user.id,
    ...req.body,
  });
  res.status(201).json({ success: true, data: transaction });
});

export const removeBankTransaction = asyncHandler(async (req, res) => {
  const transaction = await deleteBankTransaction({ organizationId: req.user.organizationId, transactionId: req.params.transactionId });
  res.json({ success: true, data: { id: transaction.id } });
});
