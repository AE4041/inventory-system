// Backend-sent Telegram alerts — separate from the router's own hardcoded sale alerts,
// since only the backend can see stock levels. Used for conditions the router has no way
// to know about: a MikroTik-mapped product running low, or a redemption getting rejected
// because stock already hit zero (see mikrotikIntegration.controller.js).
//
// Deliberately never throws: a missing/misconfigured bot for a store, or Telegram being
// briefly unreachable, must never break the voucher-redeemed webhook the router depends on.
export async function sendTelegramAlert(store, text) {
  if (!store.telegramBotToken || !store.telegramChatId) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${store.telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: store.telegramChatId, text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[telegram] send failed for store ${store.id}: ${res.status} ${body}`);
    }
  } catch (err) {
    console.error(`[telegram] send error for store ${store.id}:`, err.message);
  }
}
