#!/usr/bin/env node

/**
 * Generador dinamico de environment.prod.ts
 * Uso: node scripts/generate-environment.js [entorno] [--api-port=XXXX] [--api-host=X.X.X.X]
 *
 * Variables configuradas: url_api
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const {
  APP_NAME,
  BASE_HREF,
  DEFAULT_DEV_API_PORT,
  DEV_PORTS,
  DEV_SERVER,
  PROD_SERVER,
  STAGING_SERVER
} = require('./shared-config');

dotenv.config();

// ==========================================
// CONFIGURACION DEL PROYECTO (PORTABILIDAD)
// ==========================================
const PROJECT_CONFIG = {
  appName: APP_NAME,
  baseHref: BASE_HREF,
  iisRoot: 'C:\\inetpub\\wwwroot'
};

// Configuracion de entornos
const configs = {};

// Desarrollo dinamico
DEV_PORTS.forEach(port => {
  const key = port === 80 ? 'dev80' : `dev${port}`;
  const apiVarName = `DEV_${port}_API`;
  const apiPortVarName = `DEV_${port}_API_PORT`;

  configs[key] = {
    url_api_base: process.env[apiVarName] || `http://${DEV_SERVER}`,
    environmentName: `Desarrollo - Puerto ${port}`,
    server: DEV_SERVER,
    port,
    defaultApiPort: process.env[apiPortVarName] || DEFAULT_DEV_API_PORT,
    production: false
  };
});

// Calidad
configs['calidad'] = {
  environmentName: 'Quality / QA',
  production: false,
  url_api_base: process.env.CALIDAD_API || 'http://10.100.6.19',
  server: STAGING_SERVER,
  defaultApiPort: process.env.CALIDAD_API_PORT || null
};

// Produccion
configs['production'] = {
  url_api_base: process.env.PROD_API || 'http://172.16.3.90',
  environmentName: 'Produccion',
  server: PROD_SERVER,
  defaultApiPort: process.env.PROD_API_PORT || null,
  production: true
};
configs['prod'] = configs['production'];

function normalizeUrl(base) {
  const url = new URL(base);
  const pathname = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
  return `${url.protocol}//${url.host}${pathname}`;
}

function buildApiUrl(base, port) {
  try {
    const url = new URL(base);

    if (port && port !== 'default') {
      url.port = String(port);
    }

    const pathname = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    return `${url.protocol}//${url.host}${pathname}`;
  } catch {
    return base;
  }
}

function extractHost(urlLike) {
  try {
    return new URL(urlLike).hostname;
  } catch {
    return urlLike;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  let targetEnv = 'production';
  let apiPort = null;
  let apiHost = null;

  args.forEach(arg => {
    if (arg.startsWith('--api-port=')) {
      apiPort = arg.split('=')[1];
    } else if (arg.startsWith('--api-host=')) {
      apiHost = arg.split('=')[1];
    } else if (!arg.startsWith('-')) {
      targetEnv = arg;
    }
  });

  return { targetEnv, apiPort, apiHost };
}

function isDevEnvironmentKey(envKey) {
  return envKey.startsWith('dev');
}

function isValidDevApiPort(port) {
  const parsed = Number(port);
  return Number.isInteger(parsed) && parsed >= 9090 && parsed <= 9099;
}

function generateEnvironment(targetEnv, apiPort, apiHost) {
  const config = configs[targetEnv];
  if (!config) {
    console.error(`[ERROR] Environment not found: "${targetEnv}"`);
    process.exit(1);
  }

  if (isDevEnvironmentKey(targetEnv) && apiPort && !isValidDevApiPort(apiPort)) {
    console.error('[ERROR] Invalid dev API port. Use range 9090-9099.');
    process.exit(1);
  }

  const apiBase = apiHost && isDevEnvironmentKey(targetEnv)
    ? `http://${apiHost}`
    : config.url_api_base;
  const resolvedApiPort = apiPort ?? config.defaultApiPort ?? null;
  const finalApiUrl = resolvedApiPort
    ? buildApiUrl(apiBase, resolvedApiPort)
    : normalizeUrl(apiBase);
  const timestamp = new Date().toISOString();
  const apiPortDisplay = resolvedApiPort || 'default';

  console.log(`[ENV] ${config.environmentName} -> ${finalApiUrl}`);

  const content = `/**
 * Environment Configuration - Generated Build
 *
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * Environment: ${config.environmentName}
 * Server:      ${config.server}${config.port ? '\n * Frontend:   Port ' + config.port : ''}
 * API Host:    ${apiHost && isDevEnvironmentKey(targetEnv) ? apiHost : extractHost(apiBase)}
 * API Port:    ${apiPortDisplay}
 * Generated:   ${timestamp}
 * Variables:   url_api
 *
 * To modify configuration, edit:
 *   - scripts/generate-environment.js
 *   - scripts/shared-config.js
 *   - .env
 */

export const environment = {
  production: ${config.production ? 'true' : 'false'},

  url_api: '${finalApiUrl}',

  _meta: {
    environmentName: '${config.environmentName}',
    server: '${config.server}',
    ${config.port ? `port: ${config.port},\n    ` : ''}apiPort: '${apiPortDisplay}',
    generatedAt: '${timestamp}'
  }
};
`;

  fs.writeFileSync(path.join(__dirname, '../src/environments/environment.prod.ts'), content);
  console.log('[OK] Environment file generated');
  console.log('[VARS] Incluidas: url_api');
}

function main() {
  console.log('\n' + '='.repeat(60));
  console.log('DYNAMIC ENVIRONMENT GENERATOR');
  console.log('='.repeat(60));

  const { targetEnv, apiPort, apiHost } = parseArgs();
  const config = configs[targetEnv];

  if (!config) {
    console.error(`[ERROR] Environment not found: "${targetEnv}"`);
    process.exit(1);
  }

  console.log(`[CONFIG] ${config.environmentName}`);
  generateEnvironment(targetEnv, apiPort, apiHost);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  }
}

module.exports = {
  PROJECT_CONFIG,
  generateEnvironment
};
