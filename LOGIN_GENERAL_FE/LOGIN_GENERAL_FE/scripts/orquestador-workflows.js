#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

function runCommand(step) {
  console.log(`\n[RUN] ${step.label}`);
  console.log(`      ${step.command} ${step.args.join(' ')}`);

  const result = spawnSync(step.command, step.args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: true
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function printDocs(docs) {
  if (!docs.length) {
    return;
  }

  console.log('\nReferencias del workflow:');
  docs.forEach((doc) => console.log(`  - ${doc}`));
}

function parseOptions(args) {
  const options = {};

  args.forEach((arg) => {
    if (!arg.startsWith('--')) {
      return;
    }

    const [rawKey, rawValue] = arg.slice(2).split('=');
    options[rawKey] = rawValue ?? 'true';
  });

  return options;
}

function buildRecipes(options) {
  const apiPort = options['api-port'] || '9093';
  const frontPort = options['front-port'] || '80';

  return {
    'deploy-audit': {
      description: 'Verifica que el pipeline de build/deploy del repo este consistente.',
      docs: [
        '.agent/workflows/migrate-deploy.md',
        '.agent/workflows/sync-deploy-changes.md',
        '.agent/workflows/update-readme.md'
      ],
      steps: [
        { label: 'Verificacion rapida', command: 'npm', args: ['run', 'verify'] },
        { label: 'Validacion completa', command: 'npm', args: ['run', 'validate'] }
      ]
    },
    'pre-qa': {
      description: 'Ejecuta la verificacion tecnica previa a QA.',
      docs: [
        '.agent/workflows/CHECKLIST_UNIFICADO_PRE_QA.md',
        '.agent/workflows/workflow-base-frontend-estandar.md'
      ],
      steps: [
        { label: 'Verificacion rapida', command: 'npm', args: ['run', 'verify'] },
        { label: 'Validacion de entornos', command: 'npm', args: ['run', 'validate'] },
        { label: 'Pruebas unitarias', command: 'npx', args: ['ng', 'test', '--watch=false', '--browsers=ChromeHeadless'] },
        { label: 'Build QA', command: 'node', args: ['scripts/build.js', 'qa'] }
      ]
    },
    'build-qa': {
      description: 'Genera compilado QA usando el generador de environments del repo.',
      docs: [
        '.agent/workflows/migrate-deploy.md',
        '.agent/workflows/orquestador-workflows.md'
      ],
      steps: [
        { label: 'Build QA', command: 'node', args: ['scripts/build.js', 'qa'] }
      ]
    },
    'build-prod': {
      description: 'Genera compilado productivo deterministico.',
      docs: [
        '.agent/workflows/migrate-deploy.md',
        '.agent/workflows/orquestador-workflows.md'
      ],
      steps: [
        { label: 'Build PROD', command: 'node', args: ['scripts/build.js', 'prod'] }
      ]
    },
    'deploy-dev': {
      description: 'Ejecuta deploy DEV con puertos explicitos.',
      docs: [
        '.agent/workflows/migrate-deploy.md',
        '.agent/workflows/sync-deploy-changes.md'
      ],
      steps: [
        {
          label: 'Deploy DEV',
          command: 'node',
          args: ['scripts/deploy.js', 'dev', `--front-port=${frontPort}`, `--api-port=${apiPort}`]
        }
      ]
    },
    'docs-audit': {
      description: 'Verifica que todos los .md en docs/ esten enlazados en docs/README.md.',
      docs: [
        'docs/README.md'
      ],
      steps: [
        { label: 'Auditoria de documentacion', command: 'node', args: ['scripts/orquestador-docs.js', 'audit'] }
      ]
    },
    'docs-check': {
      description: 'Detecta archivos protegidos (evidencia historica) eliminados del repositorio.',
      docs: [
        'docs/README.md'
      ],
      steps: [
        { label: 'Verificacion de integridad de documentos', command: 'node', args: ['scripts/orquestador-docs.js', 'check-deletions'] }
      ]
    },
    'agent-precheck': {
      description: 'FASE 1 del protocolo de revision segura: verifica el estado del proyecto ANTES de que un agente haga cambios.',
      docs: [
        '.agent/workflows/safe-agent-review.md'
      ],
      steps: [
        { label: '[PRE 1/3] Verificar configuracion del proyecto', command: 'npm', args: ['run', 'verify'] },
        { label: '[PRE 2/3] Verificar integridad de documentos protegidos', command: 'node', args: ['scripts/orquestador-docs.js', 'check-deletions'] },
        { label: '[PRE 3/3] Auditar cobertura de docs/README.md', command: 'node', args: ['scripts/orquestador-docs.js', 'audit'] }
      ]
    },
    'agent-postcheck': {
      description: 'FASE 3 del protocolo de revision segura: verifica el estado del proyecto DESPUES de que un agente hizo cambios.',
      docs: [
        '.agent/workflows/safe-agent-review.md'
      ],
      steps: [
        { label: '[POST 1/4] Verificar configuracion del proyecto', command: 'npm', args: ['run', 'verify'] },
        { label: '[POST 2/4] Verificar que no se eliminaron documentos protegidos', command: 'node', args: ['scripts/orquestador-docs.js', 'check-deletions'] },
        { label: '[POST 3/4] Auditar que nuevos MDs quedaron registrados', command: 'node', args: ['scripts/orquestador-docs.js', 'audit'] },
        { label: '[POST 4/4] Build de verificacion QA', command: 'node', args: ['scripts/build.js', 'qa'] }
      ]
    }
  };
}

function printHelp(recipes) {
  console.log('\nORQUESTADOR DE WORKFLOWS FE\n');
  console.log('Uso:');
  console.log('  npm run workflow:list');
  console.log('  npm run workflow -- run <receta> [--api-port=9093] [--front-port=80]');
  console.log('  node scripts/orquestador-workflows.js run <receta>\n');
  console.log('Recetas disponibles:');

  Object.entries(recipes).forEach(([name, recipe]) => {
    console.log(`  - ${name}: ${recipe.description}`);
  });

  console.log('\nNotas:');
  console.log('  - QA solo tiene build habilitado en este repo.');
  console.log('  - PROD solo tiene build habilitado; el deploy queda fuera del flujo simple.');
}

function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'list';
  const recipeName = action === 'run' ? args[1] : null;
  const optionArgs = action === 'run' ? args.slice(2) : args.slice(1);
  const options = parseOptions(optionArgs);
  const recipes = buildRecipes(options);

  if (action === 'list' || action === 'help' || action === '--help') {
    printHelp(recipes);
    return;
  }

  if (action !== 'run' || !recipeName) {
    printHelp(recipes);
    process.exit(1);
  }

  const recipe = recipes[recipeName];
  if (!recipe) {
    console.error(`\n[ERROR] Receta no encontrada: ${recipeName}`);
    printHelp(recipes);
    process.exit(1);
  }

  console.log(`\n[WORKFLOW] ${recipeName}`);
  console.log(`[INFO] ${recipe.description}`);
  printDocs(recipe.docs);

  recipe.steps.forEach(runCommand);

  console.log('\n[OK] Workflow completado.');
}

main();
