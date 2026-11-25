#!/usr/bin/env node

/**
 * SCRIPT DE DEPLOY INTERACTIVO (SIMPLE)
 *
 * Flujo interactivo:
 * - Pregunta DEV o QA
 * - DEV: solicita puerto frontend (80/8080-8089) y puerto backend API (9090-9099)
 * - QA: bloqueado (opcion A) hasta habilitar SSH
 *
 * Uso no interactivo:
 *   npm run deploy -- dev --front-port=8080 --api-port=9093
 *   npm run deploy -- 8080 --api-port=9093
 *   npm run deploy -- qa
 */

const { spawn } = require('child_process');
const readline = require('readline');
const {
  APP_NAME,
  DEV_SERVER,
  DEV_PORTS,
  DEFAULT_DEV_API_PORT,
  DEV_BACKEND_HOST,
  DEV_FRONTEND_PORT,
  QA_BACKEND_HOST,
  QA_FRONTEND_HOST
} = require('./shared-config');

function isValidDevApiPort(port) {
  const parsed = Number(port);
  return Number.isInteger(parsed) && parsed >= 9090 && parsed <= 9099;
}

function isValidFrontPort(port) {
  const parsed = Number(port);
  return Number.isInteger(parsed) && DEV_PORTS.includes(parsed);
}

function normalizeTarget(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (value === 'dev' || value === 'dev80') {
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
  console.log('🚀 DEPLOY INTERACTIVO - ' + APP_NAME.toUpperCase());
  console.log('============================================================\n');
  console.log(`DEV -> Front SSH ${DEV_SERVER} (app_${DEV_FRONTEND_PORT}) + backend ${DEV_BACKEND_HOST}`);
  console.log(`QA  -> Front ${QA_FRONTEND_HOST} / backend ${QA_BACKEND_HOST} (deploy bloqueado por SSH)\n`);
  console.log('------------------------------------------------------------');
}

function runGulpTask(task, envOverrides = {}) {
  const childEnv = { ...process.env, ...envOverrides };

  const gulp = spawn('npx', ['gulp', task], {
    stdio: 'inherit',
    shell: true,
    env: childEnv
  });

  gulp.on('close', code => process.exit(code));
}

function deployTarget(target, options = {}) {
  if (target === 'dev') {
    const frontPort = options.frontPort || String(DEV_FRONTEND_PORT);
    const apiPort = options.apiPort || DEFAULT_DEV_API_PORT;

    if (!isValidFrontPort(frontPort)) {
      console.log(`\n❌ Puerto frontend no valido. Use: ${DEV_PORTS.join(', ')}\n`);
      process.exit(1);
    }

    if (!isValidDevApiPort(apiPort)) {
      console.log('\n❌ Puerto API no valido. Use rango 9090-9099.\n');
      process.exit(1);
    }

    console.log(`\n🎯 Desplegando DEV (frontend app_${frontPort})`);
    console.log(`   Backend API: ${DEV_BACKEND_HOST}:${apiPort}`);
    console.log('============================================================\n');

    runGulpTask(`build:dev:${frontPort}`, {
      TARGET_API_HOST: DEV_BACKEND_HOST,
      TARGET_API_PORT: String(apiPort),
      DEV_FRONTEND_PORT: String(frontPort)
    });
    return;
  }

  if (target === 'qa') {
    console.log('\n🚫 Deploy QA bloqueado (Opcion A).');
    console.log(`   Front QA esperado: ${QA_FRONTEND_HOST}`);
    console.log(`   Back QA esperado:  ${QA_BACKEND_HOST}`);
    console.log('   Motivo: SSH no esta habilitado en QA todavia.\n');
    process.exit(1);
  }

  if (target === 'prod') {
    console.log('\n⚠️ Produccion fuera de este flujo simple. Use proceso controlado de release.\n');
    process.exit(1);
  }

  console.log('\n❌ Entorno no valido. Opciones: dev, qa\n');
  process.exit(1);
}

function main() {
  const arg = process.argv[2];
  const extraArgs = process.argv.slice(3);

  let cliApiPort = null;
  let cliFrontPort = null;

  extraArgs.forEach(extra => {
    if (extra.startsWith('--api-port=')) {
      cliApiPort = extra.split('=')[1];
    }
    if (extra.startsWith('--front-port=')) {
      cliFrontPort = extra.split('=')[1];
    }
  });

  if (arg) {
    if (/^\d+$/.test(arg)) {
      deployTarget('dev', { frontPort: arg, apiPort: cliApiPort });
      return;
    }

    const target = normalizeTarget(arg);
    deployTarget(target, { frontPort: cliFrontPort, apiPort: cliApiPort });
    return;
  }

  showMenu();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('¿Desplegar en DEV o QA?: ', answer => {
    const target = normalizeTarget(answer);

    if (!target) {
      rl.close();
      console.log('\n⚠️ Entorno no valido. Cancelando.\n');
      process.exit(1);
    }

    if (target !== 'dev') {
      rl.close();
      deployTarget(target);
      return;
    }

    rl.question(`Puerto frontend ${DEV_PORTS.join('/')} [${DEV_FRONTEND_PORT}]: `, frontPortAnswer => {
      const frontPort = frontPortAnswer.trim() || String(DEV_FRONTEND_PORT);

      rl.question(`Puerto backend API 9090-9099 [${DEFAULT_DEV_API_PORT}]: `, apiPortAnswer => {
        rl.close();
        const apiPort = apiPortAnswer.trim() || DEFAULT_DEV_API_PORT;
        deployTarget('dev', { frontPort, apiPort });
      });
    });
  });
}

main();
