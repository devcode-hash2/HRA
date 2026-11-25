/**
 * Configuracion compartida entre scripts
 *
 * Este archivo centraliza todas las constantes usadas por el sistema de deploy.
 * Importar desde aqui en lugar de duplicar valores.
 */

const dotenv = require('dotenv');
dotenv.config();

const APP_NAME = process.env.APP_NAME || 'login-general';
const LOGIN_PATH = (process.env.LOGIN_PATH || APP_NAME).replace(/^\/+|\/+$/g, '');
const BASE_HREF = `/${LOGIN_PATH}/`;
const ANGULAR_DIST_NAME = 'login-general';
const DIST_PATH = `./dist/${ANGULAR_DIST_NAME}/browser`;
const DEV_SERVER = process.env.DEV_SERVER_HOST || '10.100.6.24';
const STAGING_SERVER = process.env.STAGING_SERVER_HOST || '10.100.6.22';
const PROD_SERVER = process.env.PROD_SERVER_HOST || '172.16.3.94';
const DEFAULT_DEV_API_PORT = process.env.DEV_API_PORT || '9093';
const DEV_BACKEND_HOST = process.env.DEV_BACKEND_HOST || '10.100.6.24';
const QA_BACKEND_HOST = process.env.QA_BACKEND_HOST || '10.100.6.19';
const QA_FRONTEND_HOST = process.env.QA_FRONTEND_HOST || STAGING_SERVER;
const DEV_FRONTEND_PORT = parseInt(process.env.DEV_FRONTEND_PORT || '80', 10);
const DEV_PORTS = [80, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089];

// Configuracion de servidores SSH
const SERVERS = {
  desarrollo: {
    host: DEV_SERVER,
    port: parseInt(process.env.DEV_SERVER_PORT) || 22,
    username: process.env.DEV_SERVER_USER || 'admin',
    password: process.env.DEV_SERVER_PASS || '',
    remotePath: process.env.DEV_REMOTE_PATH || `/app_80/${APP_NAME}`
  },
  calidad: {
    host: STAGING_SERVER,
    port: parseInt(process.env.STAGING_SERVER_PORT) || 22,
    username: process.env.STAGING_SERVER_USER || 'admin',
    password: process.env.STAGING_SERVER_PASS || '',
    remotePath: process.env.STAGING_REMOTE_PATH || `/app_hra/${APP_NAME}`
  },
  produccion: {
    host: PROD_SERVER,
    port: parseInt(process.env.PROD_SERVER_PORT) || 22,
    username: process.env.PROD_SERVER_USER || 'admin',
    password: process.env.PROD_SERVER_PASS || '',
    remotePath: process.env.PROD_REMOTE_PATH || `/app_hra/${APP_NAME}`
  }
};

// Configuracion de entornos para deploy
const ENVIRONMENTS = {};
DEV_PORTS.forEach(port => {
  ENVIRONMENTS[String(port)] = {
    name: `Desarrollo Puerto ${port}`,
    task: `build:dev:${port}`
  };
});

ENVIRONMENTS['calidad'] = { name: 'Calidad', task: 'build:calidad' };
ENVIRONMENTS['prod'] = { name: 'Produccion', task: 'build:production' };

// Lista de entornos para validacion
const ENVIRONMENT_KEYS = [
  'dev80', 'dev8080', 'dev8081', 'dev8082', 'dev8083',
  'dev8084', 'dev8085', 'dev8086', 'dev8087', 'dev8088', 'dev8089',
  'calidad', 'production'
];

module.exports = {
  APP_NAME,
  LOGIN_PATH,
  BASE_HREF,
  ANGULAR_DIST_NAME,
  DIST_PATH,
  DEV_SERVER,
  STAGING_SERVER,
  PROD_SERVER,
  DEFAULT_DEV_API_PORT,
  DEV_BACKEND_HOST,
  QA_BACKEND_HOST,
  QA_FRONTEND_HOST,
  DEV_FRONTEND_PORT,
  DEV_PORTS,
  SERVERS,
  ENVIRONMENTS,
  ENVIRONMENT_KEYS
};
