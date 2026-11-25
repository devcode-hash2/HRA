#!/usr/bin/env node
/**
 * orquestador-docs.js
 * -------------------
 * Orquestador de documentación del proyecto.
 *
 * Responsabilidades:
 *   1. AUDIT    — Verifica que todos los .md en docs/ estén enlazados en docs/README.md
 *   2. PROTECT  — Impide eliminar MD marcados como evidencia histórica
 *   3. NEW      — Genera el esqueleto de un nuevo CAMBIOS_PENDIENTES_COMMIT_<fecha>.md
 *                 y lo registra automáticamente en docs/README.md
 *   4. LIST     — Lista todos los MD de docs/ con su estado (enlazado / huérfano)
 *
 * Uso:
 *   node scripts/orquestador-docs.js audit
 *   node scripts/orquestador-docs.js list
 *   node scripts/orquestador-docs.js new "Descripción breve del cambio"
 *   node scripts/orquestador-docs.js protect <archivo.md>
 *   node scripts/orquestador-docs.js check-deletions
 *
 * Integración en package.json:
 *   "docs:audit"   : "node scripts/orquestador-docs.js audit"
 *   "docs:list"    : "node scripts/orquestador-docs.js list"
 *   "docs:new"     : "node scripts/orquestador-docs.js new"
 *   "docs:protect" : "node scripts/orquestador-docs.js protect"
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Configuración ───────────────────────────────────────────────────────────

const REPO_ROOT  = path.resolve(__dirname, '..');
const DOCS_DIR   = path.join(REPO_ROOT, 'docs');
const README_PATH = path.join(DOCS_DIR, 'README.md');

/** Archivos que NUNCA pueden eliminarse (evidencia histórica). */
const PROTECTED_PATTERNS = [
  /^CAMBIOS_PENDIENTES_COMMIT_/,
  /^AUDITORIA_/,
  /^ANALISIS_CAUSA_RAIZ_/,
  /^DICCIONARIO_/,
];

/** Nombre del proyecto (leído de package.json). */
function getProjectName() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    return pkg.name || path.basename(REPO_ROOT);
  } catch {
    return path.basename(REPO_ROOT);
  }
}

// ─── Utilidades ──────────────────────────────────────────────────────────────

function getDateTag() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMdFiles() {
  if (!fs.existsSync(DOCS_DIR)) return [];
  return fs.readdirSync(DOCS_DIR)
    .filter(f => f.endsWith('.md') && f !== 'README.md')
    .sort();
}

function getReadmeContent() {
  if (!fs.existsSync(README_PATH)) return '';
  return fs.readFileSync(README_PATH, 'utf8');
}

function isProtected(filename) {
  return PROTECTED_PATTERNS.some(p => p.test(filename));
}

function isLinkedInReadme(filename, readmeContent) {
  // Busca la referencia en cualquier formato de enlace markdown o texto plano
  return readmeContent.includes(filename);
}

// ─── Comandos ────────────────────────────────────────────────────────────────

/**
 * AUDIT — Verifica consistencia entre docs/ y README.md.
 * Retorna código de salida != 0 si hay archivos huérfanos.
 */
function cmdAudit() {
  console.log('\n[DOCS-AUDIT] Verificando consistencia de docs/\n');

  const files       = getMdFiles();
  const readme      = getReadmeContent();
  const orphans     = [];
  const linked      = [];
  const protected_  = [];

  if (!fs.existsSync(README_PATH)) {
    console.error('[ERROR] docs/README.md no existe. Ejecuta "docs:new" para crear el primero o créalo manualmente.');
    process.exit(1);
  }

  files.forEach(f => {
    const linked_in_readme = isLinkedInReadme(f, readme);
    const prot             = isProtected(f);

    if (prot)            protected_.push(f);
    if (linked_in_readme) linked.push(f);
    else                  orphans.push(f);
  });

  // Reporte
  console.log(`  Proyecto : ${getProjectName()}`);
  console.log(`  Docs dir : ${DOCS_DIR}`);
  console.log(`  Total MD : ${files.length}`);
  console.log(`  Enlazados: ${linked.length}`);
  console.log(`  Huérfanos: ${orphans.length}`);
  console.log(`  Protegidos (no eliminables): ${protected_.length}\n`);

  if (linked.length) {
    console.log('✅ Enlazados en README:');
    linked.forEach(f => console.log(`   - ${f}${isProtected(f) ? '  🔒' : ''}`));
  }

  if (orphans.length) {
    console.log('\n⚠️  Huérfanos (no enlazados en README):');
    orphans.forEach(f => console.log(`   - ${f}${isProtected(f) ? '  🔒 PROTEGIDO' : ''}`));
    console.log('\n[ACCIÓN REQUERIDA] Agrega las referencias faltantes en docs/README.md');
    process.exit(1);
  }

  console.log('\n[OK] Todos los documentos están registrados en docs/README.md.');
}

/**
 * LIST — Lista todos los MD con estado.
 */
function cmdList() {
  const files  = getMdFiles();
  const readme = getReadmeContent();

  console.log(`\n[DOCS-LIST] ${getProjectName()} — docs/\n`);
  console.log(`  ${'Archivo'.padEnd(55)} Enlazado  Protegido`);
  console.log(`  ${'─'.repeat(55)} ─────────  ─────────`);

  if (!files.length) {
    console.log('  (sin archivos .md en docs/)');
    return;
  }

  files.forEach(f => {
    const linked = isLinkedInReadme(f, readme) ? '  ✅      ' : '  ❌      ';
    const prot   = isProtected(f)              ? '  🔒'      : '  —';
    console.log(`  ${f.padEnd(55)}${linked}${prot}`);
  });

  console.log('');
}

/**
 * NEW — Crea un CAMBIOS_PENDIENTES_COMMIT_<fecha>.md y lo registra en README.
 */
function cmdNew(description) {
  const date     = getDateTag();
  const filename = `CAMBIOS_PENDIENTES_COMMIT_${date}.md`;
  const filePath = path.join(DOCS_DIR, filename);

  if (fs.existsSync(filePath)) {
    console.log(`[INFO] ${filename} ya existe. No se sobreescribe.`);
    console.log(`       Edítalo directamente: ${filePath}`);
    process.exit(0);
  }

  const projectName = getProjectName();
  const desc = description || 'Cambios del commit pendiente';

  // Esqueleto del changelog
  const content = `# HISTORIAL DE CAMBIOS — ${projectName.toUpperCase()}

**Proyecto:** ${projectName}
**Fecha:** ${date}
**Estado:** En elaboración

---

## Resumen ejecutivo

> ${desc}

---

## 1. Cambios realizados

<!-- Describir aquí los cambios -->

---

## Archivos afectados — Resumen

| Categoría | Modificados | Nuevos | Eliminados |
|---|---|---|---|
| | | | |
| **Total** | **0** | **0** | **0** |

---

## Impacto y riesgos

| Aspecto | Evaluación | Estado |
|---|---|---|
| | | |
`;

  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[CREATED] ${filename}`);

  // Registrar en README
  registerInReadme(filename, desc);
}

/**
 * Agrega una fila al README de docs para el archivo indicado.
 */
function registerInReadme(filename, description) {
  if (!fs.existsSync(README_PATH)) {
    // Crear README mínimo
    const projectName = getProjectName();
    const initial = `# Documentación — ${projectName}\n\nÍndice de documentos activos en esta carpeta.\n\n| Documento | Descripción | Protegido |\n|---|---|---|\n`;
    fs.writeFileSync(README_PATH, initial, 'utf8');
  }

  const content = fs.readFileSync(README_PATH, 'utf8');

  if (isLinkedInReadme(filename, content)) {
    console.log(`[INFO] ${filename} ya está registrado en docs/README.md`);
    return;
  }

  const prot    = isProtected(filename) ? '🔒 Sí' : '—';
  const newRow  = `| [${filename.replace('.md', '')}](${filename}) | ${description} | ${prot} |`;

  // Insertar después de la cabecera de la tabla o al final
  const tableHeaderRegex = /(\|\s*Documento\s*\|.*\n\|[-|]+\n)/;
  let newContent;
  if (tableHeaderRegex.test(content)) {
    newContent = content.replace(tableHeaderRegex, `$1${newRow}\n`);
  } else {
    newContent = content.trimEnd() + `\n\n| Documento | Descripción | Protegido |\n|---|---|---|\n${newRow}\n`;
  }

  fs.writeFileSync(README_PATH, newContent, 'utf8');
  console.log(`[REGISTERED] ${filename} → docs/README.md`);
}

/**
 * PROTECT — Marca un archivo como protegido agregando su patrón a PROTECTED_PATTERNS
 * en tiempo de ejecución (informativo, los patrones son hard-coded en este script).
 */
function cmdProtect(filename) {
  if (!filename) {
    console.error('[ERROR] Indica el nombre del archivo a proteger.');
    process.exit(1);
  }
  const filePath = path.join(DOCS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] Archivo no encontrado: ${filePath}`);
    process.exit(1);
  }
  const prot = isProtected(filename);
  if (prot) {
    console.log(`[INFO] ${filename} ya está cubierto por un patrón de protección existente.`);
  } else {
    console.log(`[WARN] ${filename} NO está cubierto por ningún patrón de protección.`);
    console.log(`       Agrega su prefijo a PROTECTED_PATTERNS en scripts/orquestador-docs.js`);
  }
}

/**
 * CHECK-DELETIONS — Detecta si algún archivo protegido ha sido eliminado
 * comparando contra lo listado en docs/README.md.
 */
function cmdCheckDeletions() {
  console.log('\n[DOCS-CHECK-DELETIONS] Verificando integridad de archivos protegidos\n');

  const readme  = getReadmeContent();
  const missing = [];

  // Extraer todos los enlaces markdown del README: [texto](archivo.md)
  const linkRegex = /\[.*?\]\(([\w\-\.]+\.md)\)/g;
  let match;
  while ((match = linkRegex.exec(readme)) !== null) {
    const linkedFile = match[1];
    if (!isProtected(linkedFile)) continue;
    const fullPath = path.join(DOCS_DIR, linkedFile);
    if (!fs.existsSync(fullPath)) {
      missing.push(linkedFile);
    }
  }

  if (missing.length) {
    console.error('🚨 ARCHIVOS PROTEGIDOS ELIMINADOS DETECTADOS:');
    missing.forEach(f => console.error(`   - ${f}`));
    console.error('\n[BLOQUEADO] Restaura los archivos eliminados antes de continuar.');
    process.exit(1);
  }

  console.log('[OK] Todos los archivos protegidos existen en disco.');
}

// ─── Main ────────────────────────────────────────────────────────────────────

function printHelp() {
  const projectName = getProjectName();
  console.log(`\nORQUESTADOR DE DOCUMENTACIÓN — ${projectName}\n`);
  console.log('Uso:');
  console.log('  node scripts/orquestador-docs.js <comando> [args]\n');
  console.log('Comandos:');
  console.log('  audit             Verifica que todos los .md estén enlazados en docs/README.md');
  console.log('  list              Lista todos los .md con estado (enlazado/huérfano/protegido)');
  console.log('  new [descripción] Crea CAMBIOS_PENDIENTES_COMMIT_<fecha>.md y lo registra');
  console.log('  protect <archivo> Informa si un archivo está bajo protección');
  console.log('  check-deletions   Detecta archivos protegidos eliminados\n');
  console.log('Patrones protegidos (no eliminables):');
  PROTECTED_PATTERNS.forEach(p => console.log(`  - ${p}`));
  console.log('');
}

function main() {
  const args    = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'audit':            cmdAudit(); break;
    case 'list':             cmdList(); break;
    case 'new':              cmdNew(args.slice(1).join(' ')); break;
    case 'protect':          cmdProtect(args[1]); break;
    case 'check-deletions':  cmdCheckDeletions(); break;
    default:                 printHelp(); break;
  }
}

main();
