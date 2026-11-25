#!/usr/bin/env node

/**
 * Valida consistencia de configuracion de entornos sin ejecutar deploy real.
 * El objetivo es validar build/configuracion, no afirmar que todos los deploys
 * esten habilitados.
 */

const fs = require('fs');
const path = require('path');

require('dotenv').config();

const environments = [
  'dev80', 'dev8080', 'dev8081', 'dev8082', 'dev8083',
  'dev8084', 'dev8085', 'dev8086', 'dev8087', 'dev8088', 'dev8089',
  'calidad', 'production'
];

const criticalFiles = [
  { path: 'gulpfile.js', desc: 'Gulp - Automatizacion' },
  { path: 'scripts/generate-environment.js', desc: 'Generador de environments' },
  { path: 'scripts/orquestador-workflows.js', desc: 'Orquestador ejecutable' },
  { path: 'package.json', desc: 'Configuracion NPM' },
  { path: 'angular.json', desc: 'Configuracion Angular' }
];

const requiredScripts = [
  { name: 'deploy', task: 'node scripts/deploy.js' },
  { name: 'deploy:calidad', task: 'node scripts/deploy.js calidad' },
  { name: 'deploy:prod', task: 'node scripts/deploy.js prod' },
  { name: 'workflow', task: 'node scripts/orquestador-workflows.js' },
  { name: 'verify', task: 'node verify-config.js' },
  { name: 'validate', task: 'node scripts/validate-all-environments.js' }
];

const criticalDeps = [
  'gulp',
  'ssh2',
  'archiver',
  'dotenv',
  '@angular/core',
  '@angular/cli'
];

const requiredDirs = [
  { path: 'src', desc: 'Codigo fuente' },
  { path: 'src/environments', desc: 'Configuraciones de entorno' },
  { path: 'src/app', desc: 'Aplicacion Angular' },
  { path: 'scripts', desc: 'Scripts de utilidad' },
  { path: 'backups', desc: 'Backups remotos', optional: true }
];

const servers = {
  desarrollo: {
    host: process.env.DEV_SERVER_HOST || '10.100.6.24',
    port: process.env.DEV_SERVER_PORT || 22,
    username: process.env.DEV_SERVER_USER || 'admin'
  },
  calidad: {
    host: process.env.STAGING_SERVER_HOST || '10.100.6.22',
    port: process.env.STAGING_SERVER_PORT || 22,
    username: process.env.STAGING_SERVER_USER || 'admin'
  },
  produccion: {
    host: process.env.PROD_SERVER_HOST || '172.16.3.94',
    port: process.env.PROD_SERVER_PORT || 22,
    username: process.env.PROD_SERVER_USER || 'admin'
  }
};

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

function section(title) {
  console.log('\n' + '-'.repeat(70));
  console.log(title);
  console.log('-'.repeat(70) + '\n');
}

let errors = 0;
let warnings = 0;

console.log('\n' + '='.repeat(70));
console.log('VALIDACION COMPLETA DE ENTORNOS DE BUILD/DEPLOY');
console.log('='.repeat(70) + '\n');

console.log('Validando archivos criticos...\n');
criticalFiles.forEach((file) => {
  const filePath = path.join(__dirname, '..', file.path);
  if (fs.existsSync(filePath)) {
    console.log(`  OK   ${file.desc.padEnd(32)} ${file.path}`);
    return;
  }

  console.log(`  ERR  ${file.desc.padEnd(32)} ${file.path} [FALTA]`);
  errors++;
});

section('Scripts de package.json');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

requiredScripts.forEach((script) => {
  const current = packageJson.scripts[script.name];
  if (current === script.task) {
    console.log(`  OK   ${script.name.padEnd(18)} -> ${script.task}`);
    return;
  }

  if (current) {
    console.log(`  WARN ${script.name.padEnd(18)} -> ${current} [DIFERENTE]`);
    warnings++;
    return;
  }

  console.log(`  ERR  ${script.name.padEnd(18)} [FALTA]`);
  errors++;
});

section('Servidores declarados');

Object.entries(servers).forEach(([name, config]) => {
  console.log(`  ${name.toUpperCase()}:`);
  console.log(`    Host: ${config.host}`);
  console.log(`    Puerto SSH: ${config.port}`);
  console.log(`    Usuario: ${config.username}`);

  if (!config.host) {
    console.log('    ERR Host no configurado');
    errors++;
  }

  if (!config.username) {
    console.log('    WARN Usuario no configurado');
    warnings++;
  }

  console.log('');
});

section('Entornos configurados en generate-environment.js');

const generateEnvPath = path.join(__dirname, 'generate-environment.js');
const generateEnvContent = fs.readFileSync(generateEnvPath, 'utf8');

environments.forEach((env) => {
  const found =
    generateEnvContent.includes(`configs['${env}']`) ||
    generateEnvContent.includes(`configs["${env}"]`) ||
    generateEnvContent.includes(`key === '${env}'`) ||
    (env.startsWith('dev') && generateEnvContent.includes('forEach(port =>'));

  if (found) {
    console.log(`  OK   ${env.padEnd(15)} configurado`);
    return;
  }

  console.log(`  ERR  ${env.padEnd(15)} falta en generate-environment.js`);
  errors++;
});

section('Dependencias criticas');

criticalDeps.forEach((dep) => {
  const version = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
  if (version) {
    console.log(`  OK   ${dep.padEnd(25)} ${version}`);
    return;
  }

  console.log(`  ERR  ${dep.padEnd(25)} [NO INSTALADO]`);
  errors++;
});

section('Estructura de directorios');

requiredDirs.forEach((dir) => {
  const dirPath = path.join(__dirname, '..', dir.path);
  if (fs.existsSync(dirPath)) {
    console.log(`  OK   ${dir.desc.padEnd(30)} ${dir.path}/`);
    return;
  }

  if (dir.optional) {
    console.log(`  WARN ${dir.desc.padEnd(30)} ${dir.path}/ [OPCIONAL]`);
    warnings++;
    return;
  }

  console.log(`  ERR  ${dir.desc.padEnd(30)} ${dir.path}/ [FALTA]`);
  errors++;
});

section('Disponibilidad real del deploy');
console.log('  BUILD DEV   -> disponible');
console.log('  BUILD QA    -> disponible');
console.log('  BUILD PROD  -> disponible');
console.log('  DEPLOY DEV  -> disponible');
console.log('  DEPLOY QA   -> bloqueado por diseno');
console.log('  DEPLOY PROD -> fuera del flujo simple; requiere release controlado');

section('Backends API efectivos');
console.log(`  DEV API  -> ${getHostFromUrl(process.env.DEV_80_API || 'http://10.100.6.24')}`);
console.log(`  QA API   -> ${getHostFromUrl(process.env.CALIDAD_API || 'http://10.100.6.19')}`);
console.log(`  PROD API -> ${getHostFromUrl(process.env.PROD_API || 'http://172.16.3.90')}`);

section('Matriz oficial esperada');
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
    warnings++;
    console.log(`\n  WARN: ${name} no coincide con la matriz oficial.`);
    console.log(`  Esperado -> Front=${expected.frontendHost} / API=${expected.apiHost}`);
    console.log(`  Actual   -> Front=${actual.frontendHost} / API=${actual.apiHost}`);
  }
});

console.log('\n' + '='.repeat(70));
console.log('RESUMEN DE VALIDACION');
console.log('='.repeat(70) + '\n');
console.log(`  Entornos de build validados: ${environments.length}`);
console.log(`  Archivos criticos verificados: ${criticalFiles.length}`);
console.log(`  Scripts verificados: ${requiredScripts.length}`);
console.log(`  Dependencias verificadas: ${criticalDeps.length}\n`);

if (errors === 0) {
  console.log('  OK: La configuracion base del repo es consistente.');
  if (warnings > 0) {
    console.log(`  WARN: Se detectaron ${warnings} advertencias no bloqueantes.`);
  }
  console.log('\n  Nota: esta validacion no afirma que QA/PROD tengan deploy habilitado.');
  console.log('  Solo confirma consistencia de build, scripts y configuracion.\n');
  process.exit(0);
}

console.log(`  ERR: Se detectaron ${errors} errores bloqueantes.`);
if (warnings > 0) {
  console.log(`  WARN: Se detectaron ${warnings} advertencias adicionales.`);
}
console.log('\n  Revisa los errores anteriores antes de continuar.\n');
process.exit(1);
