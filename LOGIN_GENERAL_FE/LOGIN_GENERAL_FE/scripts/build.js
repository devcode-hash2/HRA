#!/usr/bin/env node

/**
 * SCRIPT DE BUILD DINAMICO (SIMPLE)
 *
 * Flujo interactivo:
 * - Pregunta solo DEV o QA
 * - DEV: solicita solo puerto backend API (9090-9099)
 * - QA: usa configuración fija (sin pedir IP ni puertos)
 *
 * Uso no interactivo:
 *   npm run build:env -- dev --api-port=9093
 *   npm run build:env -- qa
 */

const { spawnSync } = require('child_process');
const readline = require('readline');
const {
  BASE_HREF,
  DIST_PATH,
  DEFAULT_DEV_API_PORT,
  DEV_BACKEND_HOST,
  QA_BACKEND_HOST
} = require('./shared-config');

const BUILD_CONFIGURATION = 'production';

function isValidDevApiPort(port) {
  const parsed = Number(port);
  return Number.isInteger(parsed) && parsed >= 9090 && parsed <= 9099;
}

function normalizeTarget(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (value === 'dev' || value === '80' || value === 'dev80') {
    return 'dev';
  }
  if (value === 'qa' || value === 'calidad') {
    return 'qa';
  }
  if (value === 'prod' || value === 'production') {
    return 'prod';
  }
  return null;
}

function showMenu() {
  console.log('\n============================================================');
  console.log('BUILD DINAMICO - Selecciona entorno');
  console.log('============================================================\n');
  console.log('DEV  -> Backend fijo 10.100.6.24 + puerto API 9090-9099');
  console.log('QA   -> Backend fijo 10.100.6.19 (sin preguntas adicionales)');
  console.log('PROD -> Producción (sin preguntas adicionales)\n');
  console.log('------------------------------------------------------------');
}

function runBuild(targetEnvKey, options = {}) {
  console.log(`\nCompilando para: ${targetEnvKey}`);
  console.log('============================================================\n');

  const generatorArgs = ['scripts/generate-environment.js', targetEnvKey];
  if (options.apiHost) {
    generatorArgs.push(`--api-host=${options.apiHost}`);
  }
  if (options.apiPort) {
    generatorArgs.push(`--api-port=${options.apiPort}`);
  }

  console.log('[1/2] Generando environment...\n');
  const genResult = spawnSync('node', generatorArgs, {
    stdio: 'inherit',
    shell: true
  });

  if (genResult.status !== 0) {
    console.error('\nError generando environment');
    process.exit(1);
  }

  console.log('[2/2] Building...');

  const buildResult = spawnSync(
    'npx',
    ['ng', 'build', '--configuration', BUILD_CONFIGURATION, '--base-href', BASE_HREF],
    { stdio: 'inherit', shell: true }
  );

  if (buildResult.status !== 0) {
    console.error('\nError en compilación');
    process.exit(1);
  }

  console.log('\nBuild completado exitosamente');
  console.log(`Archivos en: ${DIST_PATH}\n`);
}

function executeTarget(target, options = {}) {
  if (target === 'dev') {
    const apiPort = options.apiPort || DEFAULT_DEV_API_PORT;
    if (!isValidDevApiPort(apiPort)) {
      console.log('\nPuerto API no válido. Use rango 9090-9099.\n');
      process.exit(1);
    }
    runBuild('dev80', { apiHost: DEV_BACKEND_HOST, apiPort });
    return;
  }

  if (target === 'qa') {
    runBuild('calidad', { apiHost: QA_BACKEND_HOST });
    return;
  }

  if (target === 'prod') {
    runBuild('production');
    return;
  }

  console.log('\nEntorno no válido. Opciones: dev, qa, prod\n');
  process.exit(1);
}

function main() {
  const arg = process.argv[2];
  const extraArgs = process.argv.slice(3);

  let cliApiPort = null;
  extraArgs.forEach(extra => {
    if (extra.startsWith('--api-port=')) {
      cliApiPort = extra.split('=')[1];
    }
  });

  if (arg) {
    const target = normalizeTarget(arg);
    executeTarget(target, { apiPort: cliApiPort });
    return;
  }

  showMenu();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('¿Compilar para DEV, QA o PROD?: ', answer => {
    const target = normalizeTarget(answer);

    if (!target) {
      rl.close();
      console.log('\nNo se especificó un entorno válido. Cancelando.\n');
      process.exit(1);
    }

    if (target !== 'dev') {
      rl.close();
      executeTarget(target);
      return;
    }

    rl.question(`Puerto backend API 9090-9099 [${DEFAULT_DEV_API_PORT}]: `, portAnswer => {
      rl.close();
      const apiPort = portAnswer.trim() || DEFAULT_DEV_API_PORT;
      executeTarget('dev', { apiPort });
    });
  });
}

main();
