#!/usr/bin/env node

/**
 * Verificacion rapida de configuracion operativa.
 * No intenta desplegar; solo confirma que el repo tiene los insumos base.
 */

const fs = require('fs');
const path = require('path');

require('dotenv').config();

const requiredFiles = [
  'gulpfile.js',
  '.env',
  'package.json',
  'scripts/deploy.js',
  'scripts/shared-config.js',
  'scripts/generate-environment.js',
  'scripts/orquestador-workflows.js'
];

const credentialKeys = [
  'DEV_SERVER_HOST',
  'DEV_SERVER_USER',
  'STAGING_SERVER_HOST',
  'STAGING_SERVER_USER',
  'PROD_SERVER_HOST',
  'PROD_SERVER_USER'
];

const expectedMatrix = {
  DEV: {
    frontendHost: '10.100.6.24',
    frontendName: 'WIN-R0CQNKDBP24',
    apiHost: '10.100.6.24',
    apiName: 'WIN-R0CQNKDBP24'
  },
  QA: {
    frontendHost: '10.100.6.22',
    frontendName: 'HR1W19DESINTR01',
    apiHost: '10.100.6.19',
    apiName: 'HR1W19DESAPP01'
  },
  PROD: {
    frontendHost: '172.16.3.94',
    frontendName: 'HR1W19PROINTR01',
    apiHost: '172.16.3.90',
    apiName: 'HR1W19PROSAPP01'
  }
};

function getHostFromUrl(urlLike) {
  try {
    return new URL(urlLike).host;
  } catch {
    return urlLike;
  }
}

function printHeader(title) {
  console.log('\n' + '='.repeat(56));
  console.log(title);
  console.log('='.repeat(56));
}

printHeader('VERIFICACION DE CONFIGURACION');

let filesOk = 0;
console.log('\nArchivos criticos:');
requiredFiles.forEach((file) => {
  const exists = fs.existsSync(path.join(__dirname, file));
  if (exists) {
    filesOk++;
    console.log(`  OK   ${file}`);
    return;
  }

  console.log(`  FALTA ${file}`);
});

console.log('\nCredenciales y hosts declarados:');
credentialKeys.forEach((key) => {
  const value = process.env[key];
  if (value && value !== 'admin') {
    console.log(`  OK   ${key}`);
    return;
  }

  console.log(`  WARN ${key} no configurado o usando valor generico`);
});

console.log('\nServidores:');
console.log(`  DEV  -> ${process.env.DEV_SERVER_HOST || '10.100.6.24'}`);
console.log(`  QA   -> ${process.env.STAGING_SERVER_HOST || '10.100.6.22'}`);
console.log(`  PROD -> ${process.env.PROD_SERVER_HOST || '172.16.3.94'}`);

console.log('\nBackends API efectivos:');
console.log(`  DEV API  -> ${getHostFromUrl(process.env.DEV_80_API || 'http://10.100.6.24')}`);
console.log(`  QA API   -> ${getHostFromUrl(process.env.CALIDAD_API || 'http://10.100.6.19')}`);
console.log(`  PROD API -> ${getHostFromUrl(process.env.PROD_API || 'http://172.16.3.90')}`);

console.log('\nMatriz oficial esperada:');
Object.entries(expectedMatrix).forEach(([name, expected]) => {
  console.log(
    `  ${name.padEnd(4)} Front=${expected.frontendHost} (${expected.frontendName}) / API=${expected.apiHost} (${expected.apiName})`
  );
});

const actualMatrix = {
  DEV: {
    frontendHost: process.env.DEV_SERVER_HOST || '10.100.6.24',
    apiHost: getHostFromUrl(process.env.DEV_80_API || 'http://10.100.6.24').split(':')[0]
  },
  QA: {
    frontendHost: process.env.STAGING_SERVER_HOST || '10.100.6.22',
    apiHost: getHostFromUrl(process.env.CALIDAD_API || 'http://10.100.6.19').split(':')[0]
  },
  PROD: {
    frontendHost: process.env.PROD_SERVER_HOST || '172.16.3.94',
    apiHost: getHostFromUrl(process.env.PROD_API || 'http://172.16.3.90').split(':')[0]
  }
};

Object.entries(expectedMatrix).forEach(([name, expected]) => {
  const actual = actualMatrix[name];
  if (actual.frontendHost !== expected.frontendHost || actual.apiHost !== expected.apiHost) {
    console.log(`\nWARN: ${name} no coincide con la matriz oficial.`);
    console.log(`  Esperado -> Front=${expected.frontendHost} / API=${expected.apiHost}`);
    console.log(`  Actual   -> Front=${actual.frontendHost} / API=${actual.apiHost}`);
  }
});

console.log('\nDisponibilidad real del flujo:');
console.log('  BUILD DEV   -> disponible');
console.log('  BUILD QA    -> disponible');
console.log('  BUILD PROD  -> disponible');
console.log('  DEPLOY DEV  -> disponible');
console.log('  DEPLOY QA   -> bloqueado por diseno en scripts/deploy.js');
console.log('  DEPLOY PROD -> fuera del flujo simple; usar release controlado');

console.log('\nComandos recomendados:');
console.log('  npm run workflow:list');
console.log('  npm run workflow:deploy-audit');
console.log('  npm run workflow:build:qa');
console.log('  npm run workflow:build:prod');
console.log('  npm run workflow -- run deploy-dev --front-port=80 --api-port=9093');

const isOk = filesOk === requiredFiles.length;

printHeader(isOk ? 'CONFIGURACION BASE OK' : 'REVISAR CONFIGURACION');
if (!isOk) {
  process.exit(1);
}
