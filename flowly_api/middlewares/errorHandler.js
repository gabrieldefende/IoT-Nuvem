const { HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');

/**
 * Middleware centralizado para tratamento de erros
 */
const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      erro: 'As imagens enviadas são muito grandes. Tente capturar novamente.',
    });
  }

  const statusCode = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || ERROR_MESSAGES.INTERNAL_ERROR;

  console.error(`[ERROR] ${statusCode} - ${message}`, err);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
