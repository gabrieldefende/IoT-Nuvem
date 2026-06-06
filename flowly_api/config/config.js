require('dotenv').config();

const config = {
  port: process.env.PORT_ENV || 5000,
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/Flowly',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'sua_chave_secreta',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  env: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  face: {
    serviceUrl: process.env.FACE_SERVICE_URL || 'http://localhost:5001',
    matchThreshold: parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.4', 10),
    sessionExpiresIn: process.env.FACE_SESSION_EXPIRES_IN || '5m',
    enrollSessionExpiresIn: process.env.FACE_ENROLL_SESSION_EXPIRES_IN || '10m',
  },
};

module.exports = config;
