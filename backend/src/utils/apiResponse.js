export function sendSuccess(res, message, data = null, meta = {}) {
  return res.json({ success: true, message, data, meta });
}
