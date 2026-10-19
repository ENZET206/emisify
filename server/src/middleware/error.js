const { ZodError } = require('zod');
const { AppError } = require('../utils/http');

function notFound(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', 'Endpoint tidak ditemukan'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const fields = {};
    for (const issue of err.issues) fields[issue.path.join('.') || '_'] = { code: issue.message };
    return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Input tidak valid', details: { fields } } });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ success: false, error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: { code: 'PAYLOAD_TOO_LARGE', message: 'Data terlalu besar' } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: { code: 'INVALID_JSON', message: 'Format JSON tidak valid' } });
  }
  console.error('[error]', err);
  return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan pada server' } });
}

module.exports = { notFound, errorHandler };
