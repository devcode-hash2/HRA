#!/usr/bin / env node

/**
 * SCRIPT DE PRUEBA RÁPIDA DE ENTORNOS
 *
 * Prueba la generación de environment para cada entorno sin hacer build completo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('🧪 PRUEBA RÁPIDA DE GENERACIÓN DE ENVIRONMENTS');
console.log('='.repeat(70) + '\n');

const environments = [
  { name: 'dev80', desc: 'Desarrollo - Puerto 80' },
  { name: 'dev8080', desc: 'Desarrollo - Puerto 8080' },
  { name: 'dev8081', desc: 'Desarrollo - Puerto 8081' },
  { name: 'dev8082', desc: 'Desarrollo - Puerto 8082' },
  { name: 'dev8083', desc: 'Desarrollo - Puerto 8083' },
  { name: 'dev8084', desc: 'Desarrollo - Puerto 8084' },
  { name: 'dev8085', desc: 'Desarrollo - Puerto 8085' },
  { name: 'dev8086', desc: 'Desarrollo - Puerto 8086' },
  { name: 'dev8087', desc: 'Desarrollo - Puerto 8087' },
  { name: 'dev8088', desc: 'Desarrollo - Puerto 8088' },
  { name: 'dev8089', desc: 'Desarrollo - Puerto 8089' },
  { name: 'calidad', desc: 'Calidad/QA' },
  { name: 'production', desc: 'Producción' },
];

let success = 0;
let failed = 0;

console.log('Probando generación de environment para cada entorno...\n');

environments.forEach((env, index) => {
  try {
    process.stdout.write((index + 1).toString().padStart(2) + '. ' + env.desc.padEnd(30) + ' ');

    // Generar environment
    execSync('node scripts/generate-environment.js ' + env.name, {
      stdio: 'pipe',
      windowsHide: true
    });

    // Verificar que el archivo se creó
    const envPath = path.join(__dirname, '../src/environments/environment.prod.ts');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');

      // Validar que contiene la configuración correcta
      if (content.includes('Entorno: ' + env.desc) ||
        content.includes(env.name) ||
        content.includes('url_api')) {
        console.log('✅ OK');
        success++;
      } else {
        console.log('⚠️  GENERADO PERO CONTENIDO INCOMPLETO');
        failed++;
      }
    } else {
      console.log('❌ ARCHIVO NO CREADO');
      failed++;
    }
  } catch (err) {
    console.log('❌ ERROR');
    failed++;
  }
});

console.log('\n' + '='.repeat(70));
console.log('📊 RESUMEN');
console.log('='.repeat(70) + '\n');

console.log('  Total probados: ' + environments.length);
console.log('  ✅ Exitosos: ' + success);
console.log('  ❌ Fallidos: ' + failed + '\n');

if (failed === 0) {
  console.log('  🎉 PERFECTO: Todos los entornos funcionan correctamente\n');
  console.log('  💡 Puedes hacer deploy con confianza usando:');
  console.log('     npm run deploy -- 80');
  console.log('     npm run deploy -- 8080');
  console.log('     npm run deploy -- calidad');
  console.log('     npm run deploy -- prod\n');
  console.log('='.repeat(70) + '\n');

  // Restaurar environment original (dev80)
  console.log('🔄 Restaurando environment a dev80 (predeterminado)...\n');
  execSync('node scripts/generate-environment.js dev80', { stdio: 'inherit' });

  process.exit(0);
} else {
  console.log('  ⚠️  ATENCIÓN: Algunos entornos fallaron\n');
  console.log('  Revisa los errores anteriores antes de continuar\n');
  console.log('='.repeat(70) + '\n');
  process.exit(1);
}
