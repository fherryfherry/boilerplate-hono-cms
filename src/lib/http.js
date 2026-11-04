class HttpError extends Error {
  constructor(status, message, code = 'ERROR', fields = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

function ok(c, data, status = 200) {
  return c.json({ data }, status);
}

function fail(c, status, message, code = 'ERROR', fields = undefined) {
  const error = { message, code };
  if (fields) error.fields = fields;
  return c.json({ error }, status);
}

// Parses a JSON request body. An empty body becomes {}; malformed JSON throws a 400.
async function readJson(c) {
  const raw = await c.req.text();
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    throw new HttpError(400, 'Body request harus berupa JSON yang valid.', 'INVALID_JSON');
  }
}

module.exports = { HttpError, ok, fail, readJson };
