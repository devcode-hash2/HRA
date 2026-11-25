#!/usr/bin/env node
/**
 * Guarda de seguridad: verifica que environment.prod.ts tenga production: true
 * antes de permitir un build de Angular.
 *
 * Se ejecuta automáticamente como prebuild cuando alguien corre `ng build`
 * directamente a través del wrapper definido en package.json ("build:ng").
 *
 * Si detecta que el archivo contiene production: false, aborta con código 1
 * e instruye al usuario a usar `npm run build` en su lugar.
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.resolve(__dirname, '../src/environments/environment.prod.ts');

if (!fs.existsSync(ENV_FILE)) {
  console.error('[CHECK-ENV] No se encontró src/environments/environment.prod.ts');
  process.exit(1);
}

const content = fs.readFileSync(ENV_FILE, 'utf-8');

// Detectar si el archivo tiene production: false (es decir, fue generado para QA/DEV)
const hasProdFalse = /production\s*:\s*false/.test(content);
const hasProdTrue = /production\s*:\s*true/.test(content);

if (hasProdFalse || !hasProdTrue) {
  console.error('\n========================================================');
  console.error('[CHECK-ENV] ERROR: environment.prod.ts NO está listo para PROD');
  console.error('  - production: false detectado (configuración QA/DEV activa)');
  console.error('');
  console.error('  Para compilar correctamente, usa:');
  console.error('    npm run build                <- Build de producción (recomendado)');
  console.error('    npm run build:env -- prod     <- Solo regenerar environment PROD');
  console.error('    npm run workflow:build:prod   <- Workflow completo de producción');
  console.error('========================================================\n');
  process.exit(1);
}

console.log('[CHECK-ENV] environment.prod.ts validado: production = true');
