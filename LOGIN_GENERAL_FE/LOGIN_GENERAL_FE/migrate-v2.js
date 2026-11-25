#!/usr/bin/env node

/**
 * SISTEMA DE MIGRACIÓN DE DEPLOY v4.0
 * 
 * Script simplificado que copia los archivos de deploy desde ADMIN_GENERAL_FE
 * y los adapta al nuevo proyecto.
 * 
 * Uso:
 *   cd F:\Pase_sgp_fua\NUEVO_PROYECTO
 *   node F:\Pase_sgp_fua\ADMIN_GENERAL_FE\migrate-deploy-system.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()));
  });
}

const SOURCE_DIR = __dirname; // Directorio donde está este script

function detectConfig() {
  let config = { appName: '', outputPath: '', baseHref: '', source: '' };

  // 1. Intentar validar desde web.config (Prioridad Alta)
  try {
    if (fs.existsSync('src/web.config')) {
      const webConfig = fs.readFileSync('src/web.config', 'utf8');
      // Buscar patrón: <action type="Rewrite" url="/ALGO/" />
      const match = webConfig.match(/<action\s+type="Rewrite"\s+url="\/([^"/]+)\/"/i);
      if (match && match[1]) {
        config.appName = match[1];
        config.baseHref = `/${match[1]}/`;
        config.source = 'src/web.config';
        console.log(`[AUTO] App Name detectado de web.config: ${config.appName}`);
      }
    }
  } catch (e) {
    // Error silencioso leyendo web.config
  }

  // 2. Si ya tenemos appName, intentar complementar con angular.json para outputPath
  // O si no tenemos appName, buscar todo en angular.json
  try {
    if (fs.existsSync('angular.json')) {
      const angularConfig = JSON.parse(fs.readFileSync('angular.json', 'utf8'));
      const defaultProject = angularConfig.defaultProject || Object.keys(angularConfig.projects)[0];

      if (defaultProject) {
        const project = angularConfig.projects[defaultProject];
        let outputPath = '';

        if (project && project.architect && project.architect.build) {
          outputPath = project.architect.build.options.outputPath;
        }

        // Si no detectamos appName de web.config, usamos el de angular.json
        if (!config.appName) {
          config.appName = defaultProject;
          config.baseHref = `/${defaultProject}/`;
          config.source = 'angular.json';
        }

        // Output path siempre viene mejor de angular.json
        config.outputPath = outputPath || `dist/${config.appName}`;
      }
    }
  } catch (e) {
    // Error silencioso leyendo angular.json
  }

  return config;
}

function normalizeOutputPath(outputPath) {
  if (!outputPath) return '';

  const normalized = outputPath
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '')
    .replace(/\/+$/, '');

  return normalized.replace(/\/browser$/, '');
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('SISTEMA DE MIGRACIÓN DE DEPLOY v4.3 (Dynamic Vars)');
  console.log('='.repeat(60) + '\n');

  // Detectar configuración
  const defaults = detectConfig();
  let customVarValues = {}; // Para almacenar valores de variables personalizadas
  if (defaults.appName) {
    const sourceLabel = defaults.source ? defaults.source : 'sistema';
    console.log(`[AUTO] Configuración detectada de ${sourceLabel}: `);
    console.log(`       App: ${defaults.appName} `);
    console.log(`       Output: ${defaults.outputPath} `);
    console.log(`       Href: ${defaults.baseHref} \n`);
  }

  // PASO 1: Información básica
  console.log('[CONFIG] CONFIGURACIÓN DEL PROYECTO\n');

  let defaultAppMsg = defaults.appName || 'ej: fua, sgp';
  if (defaults.source) {
    defaultAppMsg = `${defaults.appName} (de ${defaults.source})`;
  }
  const appName = await ask(`Nombre de la app (default: ${defaultAppMsg}): `) || defaults.appName;
  if (!appName) { console.log('[ERROR] Nombre requerido.'); rl.close(); return; }

  const appId = await ask('ID de la aplicación (ej: 1, 2, 3, 5): ');
  const devServer = await ask('Servidor de desarrollo (default: 10.100.6.24): ') || '10.100.6.24';

  const defaultBaseHref = defaults.baseHref || `/${appName}/`;
  const baseHref = await ask(`Base HREF (default: ${defaultBaseHref}): `) || defaultBaseHref;

  const defaultOutput = normalizeOutputPath(defaults.outputPath || `dist/${appName}`);
  const buildOutputInput = await ask(`Build output Angular, sin /browser (default: ${defaultOutput}): `) || defaultOutput;
  const buildOutput = normalizeOutputPath(buildOutputInput);

  const loginPath = await ask('Ruta de login (default: login-general): ') || 'login-general';

  // PASO 2: Variables de environment
  console.log('\n[ENV] VARIABLES DE ENVIRONMENT\n');
  console.log('Opciones:');
  console.log('  1) Solo url_api');
  console.log('  2) url_api + url_login (default)');
  console.log('  3) url_api + url_login + variables adicionales\n');

  const envOption = await ask('Opción (1/2/3, default: 2): ') || '2';

  let envVars = ['url_api', 'url_login', 'id_app']; // Default para opción 2
  if (envOption === '1') {
    envVars = ['url_api'];

    // Preguntar si incluir id_app (opcional en opción 1)
    const includeIdApp = await ask('¿Incluir id_app? (s/n, default: n): ') || 'n';
    if (includeIdApp.toLowerCase() === 's') {
      envVars.push('id_app');
    }
  } else if (envOption === '2') {
    envVars = ['url_api', 'url_login', 'id_app'];
  } else if (envOption === '3') {
    // url_api, url_login e id_app siempre están presentes
    envVars = ['url_api', 'url_login', 'id_app'];
    const varsInput = await ask('Variables adicionales (separadas por coma, ej: url, otra_var): ');
    const additionalVars = varsInput.split(',').map(v => v.trim()).filter(v => v && v !== 'url_api' && v !== 'url_login' && v !== 'id_app');
    envVars = [...envVars, ...additionalVars];

    // Para variables personalizadas (que no sean url_api, url_login o id_app), pedir valores
    const customVars = envVars.filter(v => v !== 'url_api' && v !== 'url_login' && v !== 'id_app');
    if (customVars.length > 0) {
      console.log('\n[CUSTOM VARS] Configuración de variables personalizadas:\n');

      for (const varName of customVars) {
        console.log(`Variable: ${varName}`);

        // DEV
        const devDefault = `http://${devServer}/api`;
        const devValue = await ask(`  [DEV] Valor (default: ${devDefault}): `) || devDefault;

        // QA
        const qaDefault = 'http://10.100.6.22/api';
        const qaValue = await ask(`  [QA] Valor (default: ${qaDefault}): `) || qaDefault;

        // PROD
        const prodDefault = 'http://172.16.3.94/api';
        const prodValue = await ask(`  [PROD] Valor (default: ${prodDefault}): `) || prodDefault;

        // Guardar los valores para pasarlos a generateEnvironmentScript
        customVarValues[varName] = { dev: devValue, qa: qaValue, prod: prodValue };
        console.log('');
      }
    }
  }

  // Mostrar resumen
  console.log('\n' + '='.repeat(60));
  console.log('[SUMMARY] RESUMEN');
  console.log('='.repeat(60));
  console.log(`  App Name:     ${appName}`);
  console.log(`  App ID:       ${appId}`);
  console.log(`  Servidor Dev: ${devServer}`);
  console.log(`  Base HREF:    ${baseHref}`);
  console.log(`  Build Output: ${buildOutput}`);
  console.log(`  Variables:    ${envVars.join(', ')}`);
  console.log('='.repeat(60) + '\n');

  const confirm = await ask('Continuar con la migración? (s/n): ');
  if (confirm.toLowerCase() !== 's') {
    console.log('[CANCELLED] Migración cancelada.');
    rl.close();
    return;
  }

  // PASO 3: Crear directorios
  console.log('\n[DIRS] Creando estructura...');
  ['scripts', 'backups', 'src/environments', 'src/app/core/services', '.agent/workflows'].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  + ${dir}/`);
    }
  });

  // PASO 4: Copiar y adaptar archivos
  console.log('\n[FILES] Generando archivos...\n');

  // Generar gulpfile.js
  try {
    generateGulpfile(appName, buildOutput, baseHref, devServer);
    console.log('  + gulpfile.js');
  } catch (e) {
    console.error('  ! Error generando gulpfile.js:', e.message);
  }

  // Generar scripts/deploy.js
  try {
    generateDeployScript(appName, devServer);
    console.log('  + scripts/deploy.js');
  } catch (e) {
    console.error('  ! Error generando scripts/deploy.js:', e.message);
  }

  // Generar scripts/generate-environment.js
  try {
    generateEnvironmentScript(appName, baseHref, appId, envVars, devServer, customVarValues);
    console.log('  + scripts/generate-environment.js');
  } catch (e) {
    console.error('  ! Error generando scripts/generate-environment.js:', e.message);
  }

  // Generar scripts/shared-config.js
  try {
    generateSharedConfig(appName, baseHref, buildOutput, devServer);
    console.log('  + scripts/shared-config.js');
  } catch (e) {
    console.error('  ! Error generando scripts/shared-config.js:', e.message);
  }

  // Generar scripts/build.js
  try {
    generateBuildScript(buildOutput);
    console.log('  + scripts/build.js');
  } catch (e) {
    console.error('  ! Error generando scripts/build.js:', e.message);
  }

  // Generar src/app/core/services/environment.service.ts
  try {
    generateEnvironmentService(devServer);
    console.log('  + src/app/core/services/environment.service.ts');
  } catch (e) {
    console.error('  ! Error generando EnvironmentService:', e.message);
  }

  // Generar verify-config.js
  try {
    generateVerifyConfig();
    console.log('  + verify-config.js');
  } catch (e) {
    console.error('  ! Error generando verify-config.js:', e.message);
  }

  // Generar scripts/validate-all-environments.js
  try {
    generateValidateScript();
    console.log('  + scripts/validate-all-environments.js');
  } catch (e) {
    console.error('  ! Error generando scripts/validate-all-environments.js:', e.message);
  }

  // Generar scripts/test-all-environments.js
  try {
    generateTestScript();
    console.log('  + scripts/test-all-environments.js');
  } catch (e) {
    console.error('  ! Error generando scripts/test-all-environments.js:', e.message);
  }

  // Configurar APP_INITIALIZER en app.config.ts
  try {
    generateAppConfig();
    console.log('  + src/app/app.config.ts (APP_INITIALIZER configurado)');
  } catch (e) {
    console.error('  ! Error configurando app.config.ts:', e.message);
  }

  // PASO 5: Credenciales
  console.log('\n[CREDS] CREDENCIALES SSH');

  if (fs.existsSync('.env')) {
    const overwrite = await ask('  .env ya existe. Sobreescribir? (s/n, default: n): ') || 'n';
    if (overwrite.toLowerCase() === 's') {
      console.log('  1) Copiar de proyecto existente');
      console.log('  2) Crear nuevo con placeholders');
      const credOption = await ask('\n  Opción (1/2, default: 2): ') || '2';

      if (credOption === '1') {
        const envPath = await ask('  Ruta al .env existente: ');
        const normalizedPath = path.normalize(envPath);
        if (normalizedPath && fs.existsSync(normalizedPath)) {
          fs.copyFileSync(normalizedPath, '.env');
          console.log('  + .env (sobreescrito/copiado)');
        } else {
          console.log('  [WARN] Archivo no encontrado, creando nuevo...');
          generateEnvFile(devServer, appName, loginPath);
          console.log('  + .env (nuevo - EDITAR CREDENCIALES)');
        }
      } else {
        generateEnvFile(devServer, appName, loginPath);
        console.log('  + .env (sobreescrito/nuevo - EDITAR CREDENCIALES)');
      }
    } else {
      console.log('  .env conservado (no modificado)');
    }
  } else {
    // ... codigo original para cuando NO existe
    console.log('  1) Copiar de proyecto existente');
    console.log('  2) Crear nuevo con placeholders');
    const credOption = await ask('\n  Opción (1/2, default: 2): ') || '2';

    if (credOption === '1') {
      const envPath = await ask('  Ruta al .env existente: ');
      const normalizedPath = path.normalize(envPath);
      if (normalizedPath && fs.existsSync(normalizedPath)) {
        fs.copyFileSync(normalizedPath, '.env');
        console.log('  + .env (copiado)');
      } else {
        console.log('  [WARN] Archivo no encontrado, creando nuevo...');
        generateEnvFile(devServer, appName, loginPath);
        console.log('  + .env (nuevo - EDITAR CREDENCIALES)');
      }
    } else {
      generateEnvFile(devServer, appName, loginPath);
      console.log('  + .env (nuevo - EDITAR CREDENCIALES)');
    }
  }

  // PASO 6: package.json
  updatePackageJson(baseHref);
  console.log('  + package.json (scripts actualizados)');

  // PASO 7: npm install
  console.log('\n[NPM] DEPENDENCIAS');
  const installDeps = await ask('Ejecutar npm install? (s/n, default: s): ') || 's';

  if (installDeps.toLowerCase() === 's') {
    console.log('\n  Instalando dependencias...\n');
    const { execSync } = require('child_process');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('\n  [OK] Dependencias instaladas');
    } catch (err) {
      console.log('\n  [WARN] Error al instalar. Ejecute npm install manualmente.');
    }
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('[OK] MIGRACIÓN COMPLETADA');
  console.log('='.repeat(60));
  console.log('\nPróximos pasos:');
  if (!fs.existsSync('.env') || installDeps.toLowerCase() !== 's') {
    console.log('  1. Editar .env con credenciales');
    console.log('  2. npm install (si no se ejecutó)');
    console.log('  3. npm run deploy\n');
  } else {
    console.log('  1. Verificar .env');
    console.log('  2. npm run deploy\n');
  }
  console.log('='.repeat(60) + '\n');

  rl.close();
}

// ============================================
// GENERADORES
// ============================================

function generateGulpfile(appName, buildOutput, baseHref, devServer) {
  const content = `/**
 * GULPFILE - Sistema de Deploy Automatizado
 * Generated for: ${appName}
 */

const gulp = require('gulp');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const clean = require('gulp-clean');
const dotenv = require('dotenv');

dotenv.config();

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
  DIST_PATH: './${buildOutput}/browser',
  BACKUP_DIR: './backups',
  BACKUP_TEMP_DIR: './backups/temp',
  DEPLOY_TEMP_DIR: './deploy-temp',
  BACKUP_TIMEOUT_MS: 60000,
  SFTP_RETRY_COUNT: 5,
  SFTP_RETRY_DELAY_MS: 1000,
  DIR_CREATE_DELAY_MS: 2000,
  DIR_VERIFY_RETRIES: 20,
  DIR_VERIFY_DELAY_MS: 500,
  SFTP_IGNORABLE_CODES: [4, 5, 11],
  DEV_PORTS: [80, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089]
};


const APP_NAME = '${appName}';
const BASE_HREF = '${baseHref}';

// ============================================
// CONFIGURACIÓN DE SERVIDORES WINDOWS
// ============================================

const servers = {
  desarrollo: {
    host: process.env.DEV_SERVER_HOST || '10.100.6.24',
    port: parseInt(process.env.DEV_SERVER_PORT || '22', 10),
    username: process.env.DEV_SERVER_USER || 'admin',
    password: process.env.DEV_SERVER_PASS || '',
    remotePath: process.env.DEV_REMOTE_PATH || 'C:\\\\inetpub\\\\wwwroot\\\\app_80\\\\' + APP_NAME
  },
  calidad: {
    host: process.env.STAGING_SERVER_HOST || '10.100.6.22',
    port: parseInt(process.env.STAGING_SERVER_PORT || '22', 10),
    username: process.env.STAGING_SERVER_USER || 'admin',
    password: process.env.STAGING_SERVER_PASS || '',
    remotePath: process.env.STAGING_REMOTE_PATH || 'C:\\\\inetpub\\\\wwwroot\\\\app_hra\\\\' + APP_NAME
  },
  produccion: {
    host: process.env.PROD_SERVER_HOST || '172.16.3.94',
    port: parseInt(process.env.PROD_SERVER_PORT || '22', 10),
    username: process.env.PROD_SERVER_USER || 'admin',
    password: process.env.PROD_SERVER_PASS || '',
    remotePath: process.env.PROD_REMOTE_PATH || 'C:\\\\inetpub\\\\wwwroot\\\\app_hra\\\\' + APP_NAME
  }
};

// ============================================
// TAREAS DE LIMPIEZA
// ============================================

gulp.task('clean:dist', function () {
  return gulp.src('dist/', { read: false, allowEmpty: true })
    .pipe(clean());
});

gulp.task('clean:temp', function () {
  return gulp.src(CONFIG.DEPLOY_TEMP_DIR, { read: false, allowEmpty: true })
    .pipe(clean());
});

// ============================================
// TAREA DE BUILD CON ENVIRONMENT DINÁMICO
// ============================================

gulp.task('build:with-env', function (done) {
  const { spawnSync, execSync } = require('child_process');
  const targetEnv = process.env.TARGET_ENV || 'production';

  console.log(\`[BUILD] Target: \${targetEnv}\`);

  // Generar environment para todos los entornos
  const result = spawnSync('node', ['scripts/generate-environment.js', targetEnv], {
    stdio: 'inherit',
    shell: true
  });

  if (result.status !== 0) {
    console.error(\`[ERROR] Environment generation failed (code: \${result.status})\`);
    done(new Error('Error generando environment'));
    return;
  }

  // Compilar con Angular
  console.log('[BUILD] Compiling Angular...');

  try {
    execSync(\`ng build --configuration production --base-href \${BASE_HREF}\`, {
      stdio: 'inherit'
    });
    console.log('[OK] Build complete');
    done();
  } catch (err) {
    console.error('[ERROR] Build failed:', err.message);
    done(err);
  }
});

// ============================================
// FUNCIÓN DE SUBIDA DE ARCHIVOS AL SERVIDOR
// (Con reintentos automáticos para manejar inestabilidad de Windows SFTP)
// ============================================

/**
 * Crea y verifica un directorio remoto de forma robusta.
 * Si la verificación falla, reintenta la creación.
 * Esto maneja conexiones inestables donde mkdir funciona pero stat falla.
 */
function ensureDirectoryExists(sftp, remotePath, callback) {
  let attempts = 0;
  const maxAttempts = 10;
  const mkdirDelay = 1500;  // Tiempo para que Windows procese mkdir
  const retryDelay = 1000;  // Tiempo entre reintentos

  function attemptCreate() {
    attempts++;
    
    // Crear directorio (ignorar errores, puede ya existir)
    sftp.mkdir(remotePath, { mode: 0o755 }, (mkdirErr) => {
      // Ignorar todos los errores de mkdir (4=ya existe, 5=bad message en Windows)
      // Dar tiempo al servidor Windows para procesar
      setTimeout(verify, mkdirDelay);
    });
  }

  function verify() {
    sftp.stat(remotePath, (err) => {
      if (!err) {
        // Directorio confirmado
        callback(true);
        return;
      }

      if (attempts >= maxAttempts) {
        console.log(\`⚠️ No se pudo crear/verificar después de \${maxAttempts} intentos: \${remotePath}\`);
        callback(false);
        return;
      }

      // Stat falló, reintentar con mkdir
      console.log(\`🔄 Reintentando mkdir (\${attempts}/\${maxAttempts})...\`);
      setTimeout(attemptCreate, retryDelay);
    });
  }

  // Comenzar con mkdir (no stat) para asegurar creación
  attemptCreate();
}

function uploadFiles(sftp, localDir, remoteDir, callback) {
  fs.readdir(localDir, (err, files) => {
    if (err) {
      callback(err);
      return;
    }

    if (files.length === 0) {
      callback();
      return;
    }

    // Separar archivos y directorios
    const items = [];
    let pending = files.length;

    files.forEach(file => {
      const localPath = path.join(localDir, file);
      fs.stat(localPath, (statErr, stat) => {
        if (!statErr) {
          items.push({ file, localPath, isDir: stat.isDirectory() });
        }
        pending--;
        if (pending === 0) {
          processItems();
        }
      });
    });

    function processItems() {
      // Ordenar: directorios primero, luego archivos
      const dirs = items.filter(i => i.isDir);
      const regularFiles = items.filter(i => !i.isDir);

      let errorCount = 0;
      let dirIndex = 0;
      let fileIndex = 0;

      // Procesar directorios uno por uno
      function processNextDir() {
        if (dirIndex >= dirs.length) {
          // Todos los directorios procesados, ahora procesar archivos
          // Esperar un momento para que SFTP sincronice
          setTimeout(processAllFiles, 500);
          return;
        }

        const item = dirs[dirIndex];
        const remotePath = remoteDir.replace(/\\\\/g, '/') + '/' + item.file;
        console.log(\`📁 Procesando carpeta: \${item.file}\`);

        // Intentar crear el directorio
        sftp.mkdir(remotePath, { mode: 0o755 }, (err) => {
          if (err) {
            const isIgnorable = CONFIG.SFTP_IGNORABLE_CODES.includes(err.code) ||
              err.message === 'Failure' ||
              err.message === 'Bad message';
            if (!isIgnorable) {
              console.log(\`⚠️ Error al crear \${item.file}: \${err.message}\`);
            }
          }

          // CRÍTICO: Verificar que el directorio existe antes de continuar
          ensureDirectoryExists(sftp, remotePath, (exists) => {
            if (!exists) {
              console.log(\`❌ Directorio \${item.file} no pudo ser creado/verificado\`);
              errorCount++;
              dirIndex++;
              setTimeout(processNextDir, 500);
              return;
            }

            // Recursivamente subir contenido del directorio
            uploadFiles(sftp, item.localPath, remotePath, (uploadErr) => {
              if (uploadErr) errorCount++;
              dirIndex++;
              // Delay entre directorios para evitar saturar SFTP
              setTimeout(processNextDir, 500);
            });
          });
        });
      }

      // Procesar archivos uno por uno
      function processAllFiles() {
        function processNextFile() {
          if (fileIndex >= regularFiles.length) {
            callback(errorCount > 0 ? new Error(\`\${errorCount} archivos fallaron\`) : null);
            return;
          }

          const item = regularFiles[fileIndex];
          const remotePath = remoteDir.replace(/\\\\/g, '/') + '/' + item.file;

          uploadFileWithRetry(item.localPath, remotePath, item.file, 0, () => {
            fileIndex++;
            processNextFile();
          });
        }
        processNextFile();
      }

      function uploadFileWithRetry(localPath, remotePath, fileName, retryCount, onComplete) {
        sftp.fastPut(localPath, remotePath, (err) => {
          if (!err) {
            console.log(\`✓ \${fileName}\`);
            onComplete();
          } else if (retryCount < CONFIG.SFTP_RETRY_COUNT) {
            setTimeout(() => {
              uploadFileWithRetry(localPath, remotePath, fileName, retryCount + 1, onComplete);
            }, CONFIG.SFTP_RETRY_DELAY_MS);
          } else {
            console.error(\`✗ \${fileName} - \${err.message || 'Error'} (después de \${CONFIG.SFTP_RETRY_COUNT} reintentos)\`);
            errorCount++;
            onComplete();
          }
        });
      }

      // Empezar procesando directorios
      processNextDir();
    }
  });
}

// ============================================
// FUNCIÓN PARA LIMPIAR DIRECTORIO REMOTO
// (Con reintentos y múltiples pasadas)
// ============================================

function cleanRemoteDir(sftp, remotePath, callback, passNumber = 1) {
  const normalizedPath = remotePath.replace(/\\\\\\\\/g, '/');
  const maxPasses = 3;

  if (passNumber === 1) {
    console.log('🗑️  Limpiando directorio remoto...');
  }

  sftp.readdir(normalizedPath, (err, list) => {
    if (err) {
      console.log('📁 Directorio vacío o no accesible');
      callback();
      return;
    }

    if (!list || list.length === 0) {
      if (passNumber === 1) {
        console.log('📁 Directorio ya está vacío');
      } else {
        console.log('✓ Directorio limpiado');
      }
      callback();
      return;
    }

    let itemIndex = 0;
    let errors = 0;

    // Process items sequentially with delay
    function processNextItem() {
      if (itemIndex >= list.length) {
        // All items processed
        if (errors > 0 && passNumber < maxPasses) {
          // Retry with another pass after delay
          console.log(\`⚠️ \${errors} elementos fallaron, reintentando (pasada \${passNumber + 1}/\${maxPasses})...\`);
          setTimeout(() => {
            cleanRemoteDir(sftp, remotePath, callback, passNumber + 1);
          }, 1000);
        } else if (errors > 0) {
          console.log(\`⚠️ \${errors} elementos no se pudieron eliminar después de \${maxPasses} pasadas\`);
          callback();
        } else {
          console.log('✓ Directorio limpiado');
          callback();
        }
        return;
      }

      const item = list[itemIndex];
      const itemPath = normalizedPath + '/' + item.filename;
      const isDir = item.longname && item.longname.startsWith('d');

      if (isDir) {
        // Clean subdirectory first, then remove it
        cleanRemoteDir(sftp, itemPath, () => {
          deleteWithRetry(sftp, itemPath, true, 0, (success) => {
            if (!success) errors++;
            itemIndex++;
            setTimeout(processNextItem, 100);
          });
        }, 1);
      } else {
        // Delete file with retry
        deleteWithRetry(sftp, itemPath, false, 0, (success) => {
          if (!success) errors++;
          itemIndex++;
          setTimeout(processNextItem, 50);
        });
      }
    }

    processNextItem();
  });
}

// Helper: delete file or directory with retries
function deleteWithRetry(sftp, path, isDir, retryCount, callback) {
  const maxRetries = 3;
  const operation = isDir ? sftp.rmdir.bind(sftp) : sftp.unlink.bind(sftp);

  operation(path, (err) => {
    if (!err) {
      callback(true);
    } else if (retryCount < maxRetries) {
      setTimeout(() => {
        deleteWithRetry(sftp, path, isDir, retryCount + 1, callback);
      }, 300);
    } else {
      callback(false);
    }
  });
}

// ============================================
// FUNCIÓN DE BACKUP LOCAL (VIA SFTP)
// ============================================

function backupRemote(environment, folderName = null) {
  return new Promise((resolve, reject) => {
    const config = servers[environment];
    if (!config) {
      reject(new Error(\`Entorno no encontrado: \${environment}\`));
      return;
    }

    let remotePath = config.remotePath;
    if (environment === 'desarrollo' && folderName) {
      remotePath = \`C:\\\\inetpub\\\\wwwroot\\\\app_\${folderName}\\\\\${APP_NAME}\`;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = \`backup-\${timestamp}\`;
    const backupDir = path.join(__dirname, CONFIG.BACKUP_TEMP_DIR, backupName);
    const backupZip = path.join(__dirname, CONFIG.BACKUP_DIR, \`\${backupName}.zip\`);
    const backupsDir = path.join(__dirname, CONFIG.BACKUP_DIR);

    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const conn = new Client();
    let isDone = false;
    let timeoutHandle = null;

    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) {
          if (!isDone) {
            isDone = true;
            if (timeoutHandle) clearTimeout(timeoutHandle);
            conn.end();
            console.log(\`⚠ Aviso: No se pudo crear backup (continuando)\`);
            resolve();
          }
          return;
        }

        console.log(\`Descargando archivos del servidor para backup: \${remotePath}\`);

        const downloadDir = (remoteDir, localDir) => {
          return new Promise((resolveDir) => {
            sftp.readdir(remoteDir, (err, list) => {
              if (err) {
                console.log(\`⚠ Carpeta vacía o no accesible: \${remoteDir}\`);
                resolveDir();
                return;
              }

              if (!list || list.length === 0) {
                resolveDir();
                return;
              }

              let completed = 0;
              const total = list.length;

              list.forEach(file => {
                const remoteFilePath = remoteDir + '/' + file.filename;
                const localFilePath = path.join(localDir, file.filename);

                if (file.longname && file.longname.startsWith('-')) {
                  sftp.fastGet(remoteFilePath, localFilePath, (err) => {
                    completed++;
                    if (completed === total) resolveDir();
                  });
                } else {
                  completed++;
                  if (completed === total) resolveDir();
                }
              });
            });
          });
        };

        downloadDir(remotePath.replace(/\\\\/g, '/'), backupDir)
          .then(() => {
            const output = fs.createWriteStream(backupZip);
            const archive = archiver('zip', { zlib: { level: 6 } });

            output.on('close', () => {
              const fileSizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
              console.log(\`✓ Backup creado: \${backupName}.zip (\${fileSizeMB} MB)\`);
              console.log(\`  Ubicación: \${backupZip}\`);

              try {
                const { execSync } = require('child_process');
                execSync(\`rmdir /s /q "\${backupDir}"\`, { windowsHide: true });
              } catch (e) { }

              if (!isDone) {
                isDone = true;
                if (timeoutHandle) clearTimeout(timeoutHandle);
                conn.end();
                resolve();
              }
            });

            output.on('error', () => {
              if (!isDone) {
                isDone = true;
                if (timeoutHandle) clearTimeout(timeoutHandle);
                conn.end();
                console.log(\`⚠ Aviso: Error al crear ZIP (continuando)\`);
                resolve();
              }
            });

            archive.on('error', () => {
              if (!isDone) {
                isDone = true;
                if (timeoutHandle) clearTimeout(timeoutHandle);
                conn.end();
                resolve();
              }
            });

            archive.pipe(output);
            archive.directory(backupDir, false);
            archive.finalize();
          })
          .catch(() => {
            if (!isDone) {
              isDone = true;
              if (timeoutHandle) clearTimeout(timeoutHandle);
              conn.end();
              resolve();
            }
          });
      });
    });

    conn.on('error', () => {
      if (!isDone) {
        isDone = true;
        if (timeoutHandle) clearTimeout(timeoutHandle);
        console.log(\`⚠ Aviso: Error SSH (continuando sin backup)\`);
        resolve();
      }
    });

    conn.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password
    });

    timeoutHandle = setTimeout(() => {
      if (!isDone) {
        isDone = true;
        conn.end();
        console.log(\`⚠ Aviso: Timeout en backup (continuando)\`);
        resolve();
      }
    }, CONFIG.BACKUP_TIMEOUT_MS);
  });
}

// ============================================
// FUNCIÓN PARA ASEGURAR DIRECTORIO RAÍZ
// ============================================

function ensureRootDir(sftp, remotePath, callback) {
  const normalizedPath = remotePath.replace(/\\\\/g, '/');
  
  // Construir la ruta paso a paso
  // C:/inetpub/wwwroot/app_80/login-general
  const parts = normalizedPath.split('/').filter(p => p && p !== 'C:');
  const systemDirs = ['inetpub', 'wwwroot'];
  
  // Encontrar dónde empiezan los directorios de aplicación
  let startIndex = 0;
  for (let i = 0; i < parts.length; i++) {
    if (systemDirs.includes(parts[i].toLowerCase())) {
      startIndex = i + 1;
    } else {
      break;
    }
  }
  
  // Construir path base (hasta wwwroot)
  let basePath = 'C:';
  for (let i = 0; i < startIndex && i < parts.length; i++) {
    basePath += '/' + parts[i];
  }
  
  // Lista de directorios a crear (app_80, login-general)
  const dirsToCreate = parts.slice(startIndex);
  let currentPath = basePath;
  let dirIndex = 0;
  
  console.log(\`📂 Creando estructura: \${dirsToCreate.join('/')}\`);
  
  function createNextDir() {
    if (dirIndex >= dirsToCreate.length) {
      // Todos los directorios creados y verificados
      console.log('✓ Estructura de directorios verificada');
      callback();
      return;
    }
    
    currentPath += '/' + dirsToCreate[dirIndex];
    
    // Usar la función robusta de crear/verificar
    ensureDirectoryExistsRobust(sftp, currentPath, (success) => {
      if (!success) {
        console.log(\`❌ No se pudo crear: \${currentPath}\`);
        // Intentar continuar de todos modos (el dir puede existir pero stat falla)
        console.log('⚠️ Intentando continuar...');
      }
      dirIndex++;
      createNextDir();
    });
  }
  
  createNextDir();
}

/**
 * Versión robusta para el directorio raíz con más intentos y delays más largos
 * OPTIMIZACIÓN: Primero verifica si el directorio ya existe para evitar reintentos innecesarios
 */
function ensureDirectoryExistsRobust(sftp, remotePath, callback) {
  // PASO 1: Verificar si el directorio ya existe (optimización para deploys subsecuentes)
  sftp.stat(remotePath, (statErr) => {
    if (!statErr) {
      // El directorio ya existe, no hay necesidad de crear/verificar
      callback(true);
      return;
    }

    // PASO 2: El directorio no existe, proceder con creación robusta
    let attempts = 0;
    const maxAttempts = 30;
    const mkdirDelay = 3000;
    const retryDelay = 2000;

    function attemptCreate() {
      attempts++;
      
      sftp.mkdir(remotePath, { mode: 0o755 }, (mkdirErr) => {
        setTimeout(verify, mkdirDelay);
      });
    }

    function verify() {
      sftp.stat(remotePath, (err) => {
        if (!err) {
          callback(true);
          return;
        }

        if (attempts >= maxAttempts) {
          console.log(\`⚠️ No se pudo crear/verificar después de \${maxAttempts} intentos: \${remotePath}\`);
          callback(false);
          return;
        }

        console.log(\`🔄 Reintentando (\${attempts}/\${maxAttempts}): \${remotePath.split('/').pop()}\`);
        setTimeout(attemptCreate, retryDelay);
      });
    }

    attemptCreate();
  });
}

// ============================================
// FUNCIÓN DE DEPLOY
// ============================================

function deploySSH(environment, folderName = null) {
  return new Promise((resolve, reject) => {
    const config = servers[environment];
    if (!config) {
      reject(new Error(\`Entorno no encontrado: \${environment}\`));
      return;
    }

    let remotePath = config.remotePath;
    if (environment === 'desarrollo' && folderName) {
      remotePath = \`C:\\\\inetpub\\\\wwwroot\\\\app_\${folderName}\\\\\${APP_NAME}\`;
    }

    const localPath = path.resolve(CONFIG.DIST_PATH);
    let isCompleted = false;

    const complete = (err) => {
      if (isCompleted) return;
      isCompleted = true;
      if (err) {
        console.log('\\n❌ Deploy fallido');
        reject(err);
      } else {
        console.log('\\n✅ Deploy OK');
        resolve();
      }
    };

    console.log(\`🚀 \${environment} → \${remotePath}\`);

    const conn = new Client();

    conn.on('ready', function () {

      conn.sftp((err, sftp) => {
        if (err) {
          conn.end();
          complete(err);
          return;
        }

        // Verificar/crear directorio y subir
        ensureRootDir(sftp, remotePath, () => {
          // Limpiar archivos antiguos antes de subir los nuevos
          cleanRemoteDir(sftp, remotePath, () => {
            console.log(\`📤 Subiendo archivos...\`);
            // Delay para que SFTP reconozca el directorio
            setTimeout(() => {
              uploadFiles(sftp, localPath, remotePath, (uploadErr) => {
                conn.end();
                complete(uploadErr);
              });
            }, 1000);
          });
        });
      });
    });

    conn.on('error', (err) => {
      conn.end();
      complete(err);
    });

    console.log(\`[DEBUG] Connecting to \${config.host}:\${config.port} as \${config.username}\`);
    if (!config.password) console.warn('⚠️ [WARN] Password is empty or undefined!');

    conn.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      readyTimeout: 20000,
      keepaliveInterval: 10000,
      tryKeyboard: true,
      algorithms: {
        serverHostKey: ['ssh-rsa', 'ssh-dss']
      }
    });
  });
}

// ============================================
// GENERADOR DINÁMICO DE TAREAS
// ============================================

/**
 * Crea las tareas de gulp para un puerto de desarrollo específico
 * Nota: En desarrollo NO se hace backup (solo en calidad/producción)
 */
function createDevTasks(port) {
  const portStr = String(port);
  const envName = port === 80 ? 'dev80' : \`dev\${port}\`;

  gulp.task(\`deploy:ssh:dev:\${portStr}\`, () => deploySSH('desarrollo', portStr));

  gulp.task(\`build:dev:\${portStr}\`, gulp.series(
    'clean:dist',
    function setTargetEnv(done) {
      process.env.TARGET_ENV = envName;
      done();
    },
    'build:with-env',
    \`deploy:ssh:dev:\${portStr}\`,
    'clean:temp'
  ));
}

// Generar tareas para todos los puertos de desarrollo
CONFIG.DEV_PORTS.forEach(createDevTasks);

// ============================================
// TAREAS DE CALIDAD Y PRODUCCIÓN
// ============================================

gulp.task('backup:remote:calidad', () => backupRemote('calidad'));
gulp.task('deploy:ssh:calidad', () => deploySSH('calidad'));
gulp.task('backup:remote:prod', () => backupRemote('produccion'));
gulp.task('deploy:ssh:prod', () => deploySSH('produccion'));

gulp.task('build:calidad', gulp.series(
  'clean:dist',
  function setTargetEnv(done) {
    process.env.TARGET_ENV = 'calidad';
    done();
  },
  'build:with-env',
  'backup:remote:calidad',
  'deploy:ssh:calidad',
  'clean:temp'
));

gulp.task('build:production', gulp.series(
  'clean:dist',
  function setTargetEnv(done) {
    process.env.TARGET_ENV = 'production';
    done();
  },
  'build:with-env',
  'backup:remote:prod',
  'deploy:ssh:prod',
  'clean:temp'
));

gulp.task('deploy:prod', gulp.series('build:production'));
gulp.task('default', gulp.series('build:dev:80'));
`;

  fs.writeFileSync('gulpfile.js', content);
}

function generateDeployScript(appName, devServer) {
  const content = `#!/usr/bin/env node

/**
 * SCRIPT DE DEPLOY INTERACTIVO
 * 
 * Muestra las opciones disponibles y ejecuta el deploy seleccionado.
 * 
 * Uso: npm run deploy
 */

const { spawn } = require('child_process');
const readline = require('readline');
const { APP_NAME, DEV_PORTS, ENVIRONMENTS } = require('./shared-config');


// ============================================
// MOSTRAR MENÚ
// ============================================

function showMenu() {
  console.log('\\n============================================================');
  console.log('🚀 DEPLOY INTERACTIVO - ' + APP_NAME.toUpperCase());
  console.log('============================================================\\n');

  console.log('📦 DESARROLLO:');
  console.log('   80, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089\\n');

  console.log('🏢 STAGING:');
  console.log('   calidad\\n');

  console.log('⚠️  PRODUCCIÓN:');
  console.log('   prod\\n');

  console.log('------------------------------------------------------------');
}

// ============================================
// EJECUTAR DEPLOY
// ============================================

function deploy(env) {
  const config = ENVIRONMENTS[env];
  if (!config) {
    console.log(\`\\n❌ Entorno no válido: \${env}\`);
    console.log('   Opciones: 80, 8080-8089, calidad, prod\\n');
    process.exit(1);
  }

  console.log(\`\\n🎯 Desplegando a: \${config.name}\`);
  console.log('============================================================\\n');

  // Ejecutar gulp task
  const gulp = spawn('npx', ['gulp', config.task], {
    stdio: 'inherit',
    shell: true
  });

  gulp.on('close', (code) => {
    process.exit(code);
  });
}

// ============================================
// MAIN
// ============================================

function main() {
  // Si se pasó argumento, usarlo directamente
  const arg = process.argv[2];
  if (arg) {
    deploy(arg);
    return;
  }

  // Modo interactivo
  showMenu();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('🔌 ¿A qué entorno desplegar?: ', (answer) => {
    rl.close();
    const env = answer.trim().toLowerCase();

    if (!env) {
      console.log('\\n⚠️  No se especificó entorno. Cancelando.\\n');
      process.exit(0);
    }

    deploy(env);
  });
}

main();
`;

  fs.writeFileSync('scripts/deploy.js', content);
}

function generateEnvironmentScript(appName, baseHref, appId, envVars, devServer, customVarValues = {}) {
  // ==========================================
  // DETERMINAR QUÉ VARIABLES INCLUIR
  // ==========================================
  const includeUrlApi = envVars.includes('url_api');
  const includeUrlLogin = envVars.includes('url_login');
  const includeIdApp = envVars.includes('id_app');

  // Generar la línea de url_login para configs (o vacía si no se incluye)
  const configUrlLoginLine = includeUrlLogin
    ? `\n    url_login: process.env[loginVarName] || defaultLoginUrl,`
    : '';
  const configUrlLoginCalidad = includeUrlLogin
    ? `\n      url_login: process.env.CALIDAD_LOGIN || 'http://10.100.6.22/' + (process.env.LOGIN_PATH || 'login-general'),`
    : '';
  const configUrlLoginProd = includeUrlLogin
    ? `\n  url_login: process.env.PROD_LOGIN || 'http://172.16.3.94/login-general',`
    : '';

  const content = `/**
 * Generador dinámico de environment.prod.ts
 * Uso: node scripts/generate-environment.js [entorno] [--api-port=XXXX]
 * 
 * Variables configuradas: ${envVars.join(', ')}
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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
// CONFIGURACIÓN DEL PROYECTO (PORTABILIDAD)
// ==========================================
const PROJECT_CONFIG = {
  appName: APP_NAME,                  // Nombre para carpetas y deploy
  baseHref: BASE_HREF,                // Base HREF para Angular (ng build)
  iisRoot: 'C:\\inetpub\\wwwroot'     // Raíz IIS por defecto
};

// Custom Environment Variables Configuration
const customVars = ${JSON.stringify(customVarValues || {}, null, 2)};

// Configuración de entornos
const configs = {};

// Desarrollo dinámico
DEV_PORTS.forEach(port => {
  const key = port === 80 ? 'dev80' : \`dev\${port}\`;
  
  // Nombres de variables de entorno específicos para el puerto
  const apiVarName = \`DEV_\${port}_API\`;
  const apiPortVarName = \`DEV_\${port}_API_PORT\`;
  const loginVarName = \`DEV_\${port}_LOGIN\`;
  
  // Default login URL (puerto 80 no lleva puerto en URL habitualmente, el resto sí)
  const defaultLoginUrl = port === 80 
    ? \`http://\${DEV_SERVER}/login-general\` 
    : \`http://\${DEV_SERVER}:\${port}/login-general\`;

  configs[key] = {
    url_api_base: process.env[apiVarName] || \`http://\${DEV_SERVER}\`,${configUrlLoginLine}
    environmentName: \`Desarrollo - Puerto \${port}\`,
    server: DEV_SERVER,
    port: port,
    defaultApiPort: process.env[apiPortVarName] || DEFAULT_DEV_API_PORT,
    production: false
  };
});

// Calidad
configs['calidad'] = {
  environmentName: 'Quality / QA',
  production: false,
  url_api_base: process.env.CALIDAD_API || 'http://10.100.6.19',${configUrlLoginCalidad}
  server: STAGING_SERVER,
  defaultApiPort: process.env.CALIDAD_API_PORT || null
};

// Producción
configs['production'] = {
  url_api_base: process.env.PROD_API || 'http://172.16.3.90',${configUrlLoginProd}
  environmentName: 'Producción',
  server: PROD_SERVER,
  defaultApiPort: process.env.PROD_API_PORT || null,
  production: true
};
configs['prod'] = configs['production'];


function normalizeUrl(base) {
  try {
    const url = new URL(base);
    const pathname = url.pathname === '/' ? '' : url.pathname.replace(/\\/$/, '');
    return \`\${url.protocol}//\${url.host}\${pathname}\`;
  } catch {
    return base;
  }
}

function buildApiUrl(base, port) {
  try {
    const url = new URL(base);

    if (port && port !== 'default') {
      url.port = String(port);
    }

    const pathname = url.pathname === '/' ? '' : url.pathname.replace(/\\/$/, '');
    return \`\${url.protocol}//\${url.host}\${pathname}\`;
  } catch {
    return base;
  }
}

// Inyecta el puerto en una URL base (para variables personalizadas)
// Ej: injectPort('http://10.100.6.24/fua', 8080) → 'http://10.100.6.24:8080/fua'
function injectPort(baseUrl, port) {
  if (!port || port === 80) return baseUrl;
  // Usa regex para insertar el puerto después del host
  return baseUrl.replace(/(https?:\\/\\/[^/:]+)(:\\d+)?(\\/.*)?$/, '$1:' + port + '$3');
}

function parseArgs() {
  const args = process.argv.slice(2);
  let targetEnv = 'production';
  let apiPort = null;

  args.forEach(arg => {
    if (arg.startsWith('--api-port=')) {
      apiPort = arg.split('=')[1];
    } else if (!arg.startsWith('-')) {
      targetEnv = arg;
    }
  });

  return { targetEnv, apiPort };
}

function askApiPort(config) {
  return new Promise(resolve => {
    if (!config.port) { resolve(null); return; }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(\`Puerto API backend (Enter=\${config.port}): \`, answer => {
      rl.close();
      resolve(answer.trim() || String(config.port));
    });
  });
}

function resolveCustomVar(varName, targetEnv, config, apiPort) {
  const values = customVars[varName];
  if (!values) return '';

  if (targetEnv === 'production' || targetEnv === 'prod') return values.prod;
  if (targetEnv === 'calidad') return values.qa;
  
  // Development: return base URL without port injection
  // The port is only used for url_api, not for custom vars like 'url'
  return values.dev;
}

function generateEnvironment(targetEnv, apiPort) {
  const config = configs[targetEnv];
  if (!config) {
    console.error(\`[ERROR] Environment not found: "\${targetEnv}"\`);
    process.exit(1);
  }

  const resolvedApiPort = apiPort ?? config.defaultApiPort ?? null;
  const finalApiUrl = resolvedApiPort
    ? buildApiUrl(config.url_api_base, resolvedApiPort)
    : normalizeUrl(config.url_api_base);
  const timestamp = new Date().toISOString();
  const apiPortDisplay = resolvedApiPort || 'default';

  console.log(\`[ENV] \${config.environmentName} -> \${finalApiUrl}\`);

  // Generar líneas para variables personalizadas
  let customVarsContent = '';
  Object.keys(customVars).forEach(key => {
      const value = resolveCustomVar(key, targetEnv, config, resolvedApiPort);
      customVarsContent += \`  \${key}: '\${value}',\\n\`;
      console.log(\`[VAR] \${key}: \${value}\`);
  });

  // Generar propiedades de environment dinámicamente
  let envPropsContent = '';
  ${includeUrlApi ? "envPropsContent += `  url_api: '\${finalApiUrl}',\\n`;" : '// url_api no incluido'}
  ${includeUrlLogin ? "envPropsContent += `  url_login: '\${config.url_login || \\'\\'}',\\n`;" : '// url_login no incluido'}
  ${includeIdApp ? "envPropsContent += `  id_app: '${appId}',\\n`;" : '// id_app no incluido'}

  const content = \`/**
 * Environment Configuration - Production Build
 * 
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * 
 * Environment: \${config.environmentName}
 * Server:      \${config.server}\${config.port ? '\\n * Frontend:   Port ' + config.port : ''}
 * API Port:    \${apiPortDisplay}
 * Generated:   \${timestamp}
 * Variables:   ${envVars.join(', ')}
 * 
 * To modify configuration, edit:
 *   - scripts/generate-environment.js
 *   - scripts/shared-config.js
 *   - .env
 */

export const environment = {
  production: \${config.production ? 'true' : 'false'},

\${envPropsContent}\${customVarsContent}
  _meta: {
    environmentName: '\${config.environmentName}',
    server: '\${config.server}',
    \${config.port ? \`port: \${config.port},\\n    \` : ''}apiPort: '\${apiPortDisplay}',
    generatedAt: '\${timestamp}'
  }
};
\`;

  fs.writeFileSync(path.join(__dirname, '../src/environments/environment.prod.ts'), content);
  console.log('[OK] Environment file generated');
  console.log('[VARS] Incluidas: ${envVars.join(', ')}');
}

function main() {
  console.log('\\n' + '='.repeat(60));
  console.log('DYNAMIC ENVIRONMENT GENERATOR');
  console.log('='.repeat(60));

  const { targetEnv, apiPort } = parseArgs();
  const config = configs[targetEnv];

  if (!config) {
    console.error(\`[ERROR] Environment not found: "\${targetEnv}"\`);
    process.exit(1);
  }

  console.log(\`[CONFIG] \${config.environmentName}\`);

  generateEnvironment(targetEnv, apiPort);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  }
}
`;

  fs.writeFileSync('scripts/generate-environment.js', content);
}

function generateSharedConfig(appName, baseHref, buildOutput, devServer) {
  const content = `/**
 * Configuración compartida entre scripts
 * 
 * Este archivo centraliza todas las constantes usadas por el sistema de deploy.
 * Importar desde aquí en lugar de duplicar valores.
 */

const dotenv = require('dotenv');
dotenv.config();

const APP_NAME = process.env.APP_NAME || '${appName}';
const BASE_HREF = process.env.BASE_HREF || '${baseHref}';
const DIST_PATH = './${buildOutput}/browser';
const DEV_SERVER = process.env.DEV_SERVER_HOST || '${devServer}';
const STAGING_SERVER = process.env.STAGING_SERVER_HOST || '10.100.6.22';
const PROD_SERVER = process.env.PROD_SERVER_HOST || '172.16.3.94';
const DEFAULT_DEV_API_PORT = process.env.DEV_API_PORT || '9093';
const DEV_PORTS = [80, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089];

// Configuración de servidores SSH
const SERVERS = {
  desarrollo: {
    host: DEV_SERVER,
    port: parseInt(process.env.DEV_SERVER_PORT) || 22,
    username: process.env.DEV_SERVER_USER || 'admin',
    password: process.env.DEV_SERVER_PASS || '',
    remotePath: process.env.DEV_REMOTE_PATH || \`C:\\\\inetpub\\\\wwwroot\\\\app_80\\\\\${APP_NAME}\`
  },
  calidad: {
    host: STAGING_SERVER,
    port: parseInt(process.env.STAGING_SERVER_PORT) || 22,
    username: process.env.STAGING_SERVER_USER || 'admin',
    password: process.env.STAGING_SERVER_PASS || '',
    remotePath: process.env.STAGING_REMOTE_PATH || \`C:\\\\inetpub\\\\wwwroot\\\\app_hra\\\\\${APP_NAME}\`
  },
  produccion: {
    host: PROD_SERVER,
    port: parseInt(process.env.PROD_SERVER_PORT) || 22,
    username: process.env.PROD_SERVER_USER || 'admin',
    password: process.env.PROD_SERVER_PASS || '',
    remotePath: process.env.PROD_REMOTE_PATH || \`C:\\\\inetpub\\\\wwwroot\\\\app_hra\\\\\${APP_NAME}\`
  }
};

// Configuración de entornos para deploy
const ENVIRONMENTS = {};
DEV_PORTS.forEach(port => {
  ENVIRONMENTS[String(port)] = {
    name: \`Desarrollo Puerto \${port}\`,
    task: \`build:dev:\${port}\`
  };
});

ENVIRONMENTS['calidad'] = { name: 'Calidad', task: 'build:calidad' };
ENVIRONMENTS['prod'] = { name: 'Producción', task: 'build:production' };

// Lista de entornos para validación
const ENVIRONMENT_KEYS = [
  'dev80', 'dev8080', 'dev8081', 'dev8082', 'dev8083',
  'dev8084', 'dev8085', 'dev8086', 'dev8087', 'dev8088', 'dev8089',
  'calidad', 'production'
];

module.exports = {
  APP_NAME,
  BASE_HREF,
  DIST_PATH,
  DEV_SERVER,
  STAGING_SERVER,
  PROD_SERVER,
  DEFAULT_DEV_API_PORT,
  DEV_PORTS,
  SERVERS,
  ENVIRONMENTS,
  ENVIRONMENT_KEYS
};
`;

  fs.writeFileSync('scripts/shared-config.js', content);
}

function generateEnvFile(devServer, appName, loginPath) {
  const content = `# ============================================
# CONFIGURACIÓN DE SERVIDORES WINDOWS
# ============================================
# NOTA: Este archivo NO usa dotenv-expand
# Las URLs deben escribirse completas (sin \${VAR})
# ============================================

# Nombre de la aplicación
APP_NAME=${appName}
# Ruta de login
LOGIN_PATH=${loginPath}

# ============================================
# SERVIDOR DE DESARROLLO (${devServer})
# Carpetas IIS configuradas: app_80, app_8080-app_8089
# ============================================
DEV_SERVER_HOST="${devServer}"
DEV_SERVER_PORT="22"
DEV_SERVER_USER="havel.contreras"
DEV_SERVER_PASS="HRA_code-$2023"
DEV_REMOTE_PATH="C:/inetpub/wwwroot/app_80/${appName}"
DEV_FOLDERS="80,8080,8081,8082,8083,8084,8085,8086,8087,8088,8089"

# ============================================
# SERVIDOR DE CALIDAD/STAGING (10.100.6.22)
# ============================================
STAGING_SERVER_HOST="10.100.6.22"
STAGING_SERVER_PORT="22"
STAGING_SERVER_USER="admin"
STAGING_SERVER_PASS="tu_contraseña_calidad"
STAGING_REMOTE_PATH="C:/inetpub/wwwroot/app_hra/${appName}"

# ============================================
# SERVIDOR DE PRODUCCIÓN (172.16.3.94)
# ============================================
PROD_SERVER_HOST="172.16.3.94"
PROD_SERVER_PORT="22"
PROD_SERVER_USER="admin"
PROD_SERVER_PASS="tu_contraseña_prod"
PROD_REMOTE_PATH="C:/inetpub/wwwroot/app_hra/${appName}"

# ============================================
# CONFIGURACIÓN DE URLs POR ENTORNO
# ============================================

# URLs para entornos de desarrollo (${devServer})
# IMPORTANTE: Las URLs de API son solo la IP base, sin puerto ni /api
# Las URLs de LOGIN incluyen el puerto específico para cada entorno
DEV_80_API=http://${devServer}
DEV_80_LOGIN=http://${devServer}/${loginPath}

DEV_8080_API=http://${devServer}
DEV_8080_LOGIN=http://${devServer}:8080/${loginPath}

DEV_8081_API=http://${devServer}
DEV_8081_LOGIN=http://${devServer}:8081/${loginPath}

DEV_8082_API=http://${devServer}
DEV_8082_LOGIN=http://${devServer}:8082/${loginPath}

DEV_8083_API=http://${devServer}
DEV_8083_LOGIN=http://${devServer}:8083/${loginPath}

DEV_8084_API=http://${devServer}
DEV_8084_LOGIN=http://${devServer}:8084/${loginPath}

DEV_8085_API=http://${devServer}
DEV_8085_LOGIN=http://${devServer}:8085/${loginPath}

DEV_8086_API=http://${devServer}
DEV_8086_LOGIN=http://${devServer}:8086/${loginPath}

DEV_8087_API=http://${devServer}
DEV_8087_LOGIN=http://${devServer}:8087/${loginPath}

DEV_8088_API=http://${devServer}
DEV_8088_LOGIN=http://${devServer}:8088/${loginPath}

DEV_8089_API=http://${devServer}
DEV_8089_LOGIN=http://${devServer}:8089/${loginPath}

# URLs para calidad/QA (10.100.6.22)
CALIDAD_API=http://10.100.6.19
CALIDAD_LOGIN=http://10.100.6.22/${loginPath}

# URLs para producción (API: 172.16.3.90)
PROD_API=http://172.16.3.90
PROD_LOGIN=http://172.16.3.94/${loginPath}
`;

  fs.writeFileSync('.env', content);
}

function generateEnvironmentService(devServer) {
  const content = `import { Injectable } from '@angular/core';
  import { environment } from '../../../environments/environment';

  /**
   * Interface for IP validation results
   */
  export interface IpValidationResult {
    isConsistent: boolean;
    apiHost: string | null;
    loginHost: string | null;
    message: string;
  }

  /**
   * Interface for complete server information
   */
  export interface ServerInfo {
    environmentName: string;
    apiUrl: string;
    apiHost: string | null;
    apiPort: string | null;
    loginUrl: string;
    loginHost: string | null;
    isProduction: boolean;
    isDevServer: boolean;
    serverType: 'development' | 'quality' | 'production' | 'local' | 'unknown';
    generatedAt?: string;
  }

  /**
   * Known server registry for automatic detection
   */
  interface KnownServer {
    ip: string;
    name: string;
    type: 'development' | 'quality' | 'production';
  }

  /**
   * Environment Service
   * 
   * Provides centralized environment configuration management,
   * logging, and IP validation functionality.
   * 
   * AUTO-GENERATED by migrate-deploy-system.js
   */
  @Injectable({ providedIn: 'root' })
  export class EnvironmentService {

    /**
     * Registry of known server IPs for environment detection
     * Add new servers here as the infrastructure grows
     */
    private readonly knownServers: KnownServer[] = [
      { ip: '${devServer}', name: 'Desarrollo', type: 'development' },
      { ip: '10.100.6.22', name: 'Calidad', type: 'quality' },
      { ip: '172.16.3.94', name: 'Producción', type: 'production' },
    ];

    /**
     * Logs environment configuration to console with visual formatting
     * Only displays detailed information in development/test environments
     */
    logEnvironmentInfo(): void {
      const serverInfo = this.getServerInfo();
      const validation = this.validateIpConsistency();

      // Smart Silence: Only hide info on actual production servers
      if (serverInfo.serverType === 'production') {
        if (!validation.isConsistent) {
          console.warn('%c⚠️ PRODUCTION IP MISMATCH DETECTED!', 'color: #FF5722; font-weight: bold; font-size: 14px');
          console.warn('   API host:   ' + validation.apiHost);
          console.warn('   Login host: ' + validation.loginHost);
        }
        return;
      }

      // Color based on server type
      const headerColor = this.getHeaderColor(serverInfo.serverType);
      const icon = this.getServerIcon(serverInfo.serverType);

      // Header
      console.log('%c╔══════════════════════════════════════════════════════════════════╗', 'color: ' + headerColor + '; font-weight: bold');
      console.log('%c║  ' + icon + ' ENVIRONMENT CONFIGURATION                                    ║', 'color: ' + headerColor + '; font-weight: bold');
      console.log('%c╠══════════════════════════════════════════════════════════════════╣', 'color: ' + headerColor + '; font-weight: bold');

      // Environment info
      console.log('%c║  🏷️  Environment: ' + this.padEnd(serverInfo.environmentName, 46) + '║', 'color: #2196F3');
      console.log('%c║  🔗 API URL:     ' + this.padEnd(serverInfo.apiUrl, 46) + '║', 'color: #2196F3');
      console.log('%c║  🔐 Login URL:   ' + this.padEnd(serverInfo.loginUrl, 46) + '║', 'color: #2196F3');
      console.log('%c║  🖥️  API Host:    ' + this.padEnd(serverInfo.apiHost || 'N/A', 46) + '║', 'color: #2196F3');
      console.log('%c║  🔌 API Port:    ' + this.padEnd(serverInfo.apiPort || 'N/A', 46) + '║', 'color: #2196F3');
      console.log('%c║  📦 Server Type: ' + this.padEnd(serverInfo.serverType.toUpperCase(), 46) + '║', 'color: #2196F3');

      console.log('%c╚══════════════════════════════════════════════════════════════════╝', 'color: ' + headerColor + '; font-weight: bold');

      // Validation warning if IPs don't match
      if (!validation.isConsistent) {
        console.warn('%c⚠️ IP MISMATCH DETECTED!', 'color: #FF5722; font-weight: bold; font-size: 14px');
        console.warn('   API host:   ' + validation.apiHost);
        console.warn('   Login host: ' + validation.loginHost);
        console.warn('   Please verify your environment configuration!');
      }

      // Server type indicator with specific styling
      this.logServerTypeIndicator(serverInfo.serverType);

      // Log generation timestamp if available
      if (serverInfo.generatedAt) {
        console.log('%c📅 Config generated: ' + serverInfo.generatedAt, 'color: #9E9E9E; font-style: italic');
      }
    }

    /**
     * Gets complete server information
     */
    getServerInfo(): ServerInfo {
      const apiHost = this.getApiHost();
      const apiPort = this.getApiPort();
      const loginHost = this.getLoginHost();
      const serverType = this.detectServerType(apiHost);

      return {
        environmentName: this.getEnvironmentName(),
        apiUrl: environment.url_api,
        apiHost,
        apiPort,
        loginUrl: (environment as any).url_login || '',
        loginHost,
        isProduction: environment.production,
        isDevServer: this.isDevServer(),
        serverType,
        generatedAt: this.getGeneratedAt()
      };
    }

    /**
     * Validates if url_api and url_login point to the same host
     */
    validateIpConsistency(): IpValidationResult {
      const apiHost = this.getApiHost();
      const loginHost = this.getLoginHost();

      if (!apiHost || !loginHost) {
        // Si no hay loginHost (Opción 1: solo url_api), consideramos consistente
        if (!loginHost && apiHost) {
          return {
            isConsistent: true,
            apiHost,
            loginHost,
            message: 'Single API mode (url_login not configured)'
          };
        }
        return {
          isConsistent: false,
          apiHost,
          loginHost,
          message: 'Could not parse API URL'
        };
      }

      const isConsistent = apiHost === loginHost;

      return {
        isConsistent,
        apiHost,
        loginHost,
        message: isConsistent
          ? 'All endpoints point to the same host'
          : 'IP mismatch: API(' + apiHost + ') vs Login(' + loginHost + ')'
      };
    }

    /**
     * Detects the server type based on the API host
     */
    detectServerType(apiHost: string | null): 'development' | 'quality' | 'production' | 'local' | 'unknown' {
      if (!apiHost) {
        return 'unknown';
      }

      // Check for local development
      if (apiHost === 'localhost' || apiHost === '127.0.0.1') {
        return 'local';
      }

      // Check against known servers
      const knownServer = this.knownServers.find(server => server.ip === apiHost);
      if (knownServer) {
        return knownServer.type;
      }

      // If production flag is true but not in known servers
      if (environment.production) {
        return 'production';
      }

      return 'unknown';
    }

    /**
     * Detects if the application is running on a development server
     */
    isDevServer(): boolean {
      if (!environment.production) {
        return true;
      }

      const serverType = this.detectServerType(this.getApiHost());
      return serverType === 'development' || serverType === 'local';
    }

    /**
     * Extracts hostname from url_api
     */
    getApiHost(): string | null {
      try {
        const url = new URL(environment.url_api);
        return url.hostname;
      } catch {
        return null;
      }
    }

    /**
     * Extracts port from url_api
     */
    getApiPort(): string | null {
      try {
        const url = new URL(environment.url_api);
        return url.port || null;
      } catch {
        return null;
      }
    }

    /**
     * Extracts hostname from url_login
     */
    getLoginHost(): string | null {
      try {
        const loginUrl = (environment as any).url_login;
        if (!loginUrl) return null;
        const url = new URL(loginUrl);
        return url.hostname;
      } catch {
        return null;
      }
    }

    /**
     * Gets the environment name from metadata or defaults
     */
    getEnvironmentName(): string {
      if ('_meta' in environment && environment._meta) {
        return (environment as any)._meta.environmentName || 'Unknown';
      }
      return environment.production ? 'Production' : 'Development (Local)';
    }

    /**
     * Gets the generation timestamp from metadata
     */
    getGeneratedAt(): string | undefined {
      if ('_meta' in environment && environment._meta) {
        return (environment as any)._meta.generatedAt;
      }
      return undefined;
    }

    /**
     * Gets header color based on server type
     */
    private getHeaderColor(serverType: string): string {
      switch (serverType) {
        case 'production': return '#E91E63';  // Pink/Red for production
        case 'quality': return '#9C27B0';     // Purple for quality
        case 'development': return '#4CAF50'; // Green for development
        case 'local': return '#FF9800';       // Orange for local
        default: return '#607D8B';            // Gray for unknown
      }
    }

    /**
     * Gets icon based on server type
     */
    private getServerIcon(serverType: string): string {
      switch (serverType) {
        case 'production': return '🚀';
        case 'quality': return '🧪';
        case 'development': return '🔧';
        case 'local': return '💻';
        default: return '🌐';
      }
    }

    /**
     * Logs server type specific indicator
     */
    private logServerTypeIndicator(serverType: string): void {
      switch (serverType) {
        case 'production':
          console.log('%c🚀 PRODUCTION SERVER - Handle with care!', 'color: #E91E63; font-weight: bold; font-size: 12px');
          break;
        case 'quality':
          console.log('%c🧪 QUALITY SERVER - Testing environment', 'color: #9C27B0; font-weight: bold');
          break;
        case 'development':
          console.log('%c🔧 DEVELOPMENT SERVER', 'color: #4CAF50; font-weight: bold');
          break;
        case 'local':
          console.log('%c💻 LOCAL DEVELOPMENT', 'color: #FF9800; font-weight: bold');
          break;
        default:
          console.log('%c❓ UNKNOWN SERVER TYPE', 'color: #607D8B; font-weight: bold');
      }
    }

    /**
     * Helper method to pad strings for console formatting
     */
    private padEnd(str: string, length: number): string {
      if (str.length >= length) {
        return str.substring(0, length - 3) + '...';
      }
      return str + ' '.repeat(length - str.length);
    }

    /**
     * Verifica si el servidor actual está en la lista de servidores conocidos
     */
    isKnownServer(): boolean {
      const apiHost = this.getApiHost();
      return apiHost ? this.knownServers.some(s => s.ip === apiHost) : false;
    }

    /**
     * Obtiene información del servidor conocido actual
     */
    getKnownServerInfo(): KnownServer | null {
      const apiHost = this.getApiHost();
      return this.knownServers.find(s => s.ip === apiHost) || null;
    }
  }
  `;

  fs.writeFileSync('src/app/core/services/environment.service.ts', content);
}

// ============================================
// GENERADOR DE APP.CONFIG.TS CON APP_INITIALIZER
// ============================================

function generateAppConfig() {
  const appConfigPath = 'src/app/app.config.ts';

  // Si no existe, proyecto podría usar NgModule en lugar de standalone
  if (!fs.existsSync(appConfigPath)) {
    console.log('⚠️  app.config.ts no existe - saltando (proyecto podría usar NgModule)');
    return;
  }

  let content = fs.readFileSync(appConfigPath, 'utf8');
  let modified = false;

  // Ya configurado? Verificar si tiene la factory function
  if (content.includes('initializeEnvironmentLogging')) {
    console.log('ℹ️  APP_INITIALIZER ya configurado en app.config.ts');
    return;
  }

  // 1. Agregar APP_INITIALIZER al import de @angular/core si no existe
  if (!content.includes('APP_INITIALIZER')) {
    // Buscar el import de @angular/core y agregar APP_INITIALIZER
    content = content.replace(
      /import\s*\{\s*([^}]*)\}\s*from\s*['"]@angular\/core['"]/,
      (match, imports) => {
        const importList = imports.split(',').map(i => i.trim()).filter(i => i);
        if (!importList.includes('APP_INITIALIZER')) {
          importList.push('APP_INITIALIZER');
        }
        return `import { ${importList.join(', ')} } from '@angular/core'`;
      }
    );
    modified = true;
  }

  // 2. Agregar import de EnvironmentService si no existe
  if (!content.includes('EnvironmentService')) {
    // Encontrar la última línea de import y agregar después
    const importRegex = /^import\s+.*?['"];?\s*$/gm;
    let lastImportMatch;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      lastImportMatch = match;
    }

    if (lastImportMatch) {
      const insertPos = lastImportMatch.index + lastImportMatch[0].length;
      const serviceImport = "\\nimport { EnvironmentService } from './core/services/environment.service';";
      content = content.slice(0, insertPos) + serviceImport + content.slice(insertPos);
      modified = true;
    }
  }

  // 3. Agregar factory function antes de 'export const appConfig'
  const factoryFn = `
/**
 * Factory function para APP_INITIALIZER
 * Muestra la configuración del entorno en consola al iniciar la app
 */
function initializeEnvironmentLogging(envService: EnvironmentService) {
  return () => envService.logEnvironmentInfo();
}

`;

  if (!content.includes('initializeEnvironmentLogging')) {
    content = content.replace(
      /export\s+const\s+appConfig/,
      factoryFn + 'export const appConfig'
    );
    modified = true;
  }

  // 4. Agregar provider APP_INITIALIZER en el array de providers
  if (!content.includes('provide: APP_INITIALIZER')) {
    content = content.replace(
      /providers:\s*\[/,
      `providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeEnvironmentLogging,
      deps: [EnvironmentService],
      multi: true
    },`
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(appConfigPath, content);
    console.log('✅ app.config.ts actualizado con APP_INITIALIZER');
  } else {
    console.log('ℹ️  app.config.ts no requiere cambios');
  }
}

function updatePackageJson(baseHref) {
  let pkg = {};
  if (fs.existsSync('package.json')) {
    pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  }

  pkg.scripts = pkg.scripts || {};

  // Scripts de despliegue y utilidad
  const newScripts = {
    "ng": "ng",
    "start": "ng serve --port 4200",
    "build": "ng build --configuration production --base-href ${baseHref}",
    "build:env": "node scripts/build.js",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "deploy": "node scripts/deploy.js",
    "deploy:calidad": "node scripts/deploy.js calidad",
    "deploy:prod": "node scripts/deploy.js prod",
    "verify": "node verify-config.js",
    "validate": "node scripts/validate-all-environments.js",
    "test:environments": "node scripts/test-all-environments.js"
  };

  // Merge scripts ensuring overwrites
  Object.assign(pkg.scripts, newScripts);

  // Agregar dependencias
  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies['gulp'] = '^4.0.2';
  pkg.devDependencies['gulp-clean'] = '^0.4.0';
  pkg.devDependencies['ssh2'] = '^1.14.0';
  pkg.devDependencies['dotenv'] = '^16.3.1';
  pkg.dependencies = pkg.dependencies || {};
  pkg.dependencies['archiver'] = '^7.0.1';

  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
}

function generateVerifyConfig() {
  const content = `#!/usr/bin / env node

  /**
   * VERIFICACIÓN DE CONFIGURACIÓN DE DEPLOY
   */

  const fs = require('fs');
  const path = require('path');
  require('dotenv').config();

  console.log('\\n' + '='.repeat(50));
  console.log('🔍 VERIFICACIÓN DE CONFIGURACIÓN');
  console.log('='.repeat(50));

  // Verificar archivos
  const files = ['gulpfile.js', '.env', 'package.json', 'scripts/deploy.js', 'scripts/shared-config.js', 'scripts/generate-environment.js'];
  let filesOk = 0;
  files.forEach(f => { if (fs.existsSync(path.join(__dirname, f))) filesOk++; });
  console.log('\\n📁 Archivos: ' + filesOk + '/' + files.length);
  if (filesOk < files.length) {
    files.forEach(f => {
      const exists = fs.existsSync(path.join(__dirname, f));
      if (!exists) console.log(\`   ❌ \${f}\`);
    });
  }

  // Verificar credenciales
  const creds = ['DEV_SERVER_HOST', 'DEV_SERVER_USER', 'STAGING_SERVER_HOST', 'STAGING_SERVER_USER', 'PROD_SERVER_HOST', 'PROD_SERVER_USER'];
  let credsOk = 0;
  creds.forEach(k => { if (process.env[k] && process.env[k] !== 'admin') credsOk++; });
  console.log('🔐 Credenciales: ' + credsOk + '/' + creds.length);
  if (credsOk < creds.length) {
    console.log('   ⚠️  Editar .env con credenciales SSH');
  }

  // Servidores
  console.log('\\n' + '-'.repeat(50));
  console.log('🖥️  SERVIDORES');
  console.log('-'.repeat(50));
  console.log('DEV:  ' + (process.env.DEV_SERVER_HOST || '10.100.6.24') + ' (puertos 80, 8080-8089)');
  console.log('QA:   ' + (process.env.STAGING_SERVER_HOST || '10.100.6.22'));
  console.log('PROD: ' + (process.env.PROD_SERVER_HOST || '172.16.3.94'));

  // Comandos
  console.log('\\n' + '-'.repeat(50));
  console.log('⚙️  COMANDOS');
  console.log('-'.repeat(50));
  console.log('npm run deploy          → Menú interactivo');
  console.log('npm run deploy -- 80    → Deploy a puerto 80');
  console.log('npm run deploy -- 8080  → Deploy a puerto 8080');
  console.log('npm run deploy -- calidad → Deploy a QA');
  console.log('npm run deploy -- prod  → Deploy a producción');
  console.log('npm run verify          → Esta verificación');

  console.log('\\n' + '='.repeat(50));
  console.log(filesOk === files.length && credsOk > 0 ? '✅ Configuración OK' : '⚠️  Revisar configuración');
  console.log('='.repeat(50) + '\\n');
  `;

  fs.writeFileSync('verify-config.js', content);
}

function generateValidateScript() {
  const content = `#!/usr/bin / env node

  /**
   * SCRIPT DE VALIDACIÓN DE TODOS LOS ENTORNOS
   *
   * Valida que todas las configuraciones de entornos estén correctamente definidas
   * sin realizar deploy real.
   */

  const fs = require('fs');
  const path = require('path');
  const dotenv = require('dotenv');
  dotenv.config();

  console.log('\\n' + '='.repeat(70));
  console.log('🔍 VALIDACIÓN COMPLETA DE ENTORNOS DE DESPLIEGUE');
  console.log('='.repeat(70) + '\\n');

  // ============================================
  // CONFIGURACIONES DE ENTORNOS
  // ============================================

  const environments = [
    'dev80', 'dev8080', 'dev8081', 'dev8082', 'dev8083',
    'dev8084', 'dev8085', 'dev8086', 'dev8087', 'dev8088', 'dev8089',
    'calidad', 'production'
  ];

  const servers = {
    desarrollo: {
      host: process.env.DEV_SERVER_HOST || '10.100.6.24',
      port: process.env.DEV_SERVER_PORT || 22,
      username: process.env.DEV_SERVER_USER || 'admin',
    },
    calidad: {
      host: process.env.STAGING_SERVER_HOST || '10.100.6.22',
      port: process.env.STAGING_SERVER_PORT || 22,
      username: process.env.STAGING_SERVER_USER || 'admin',
    },
    produccion: {
      host: process.env.PROD_SERVER_HOST || '172.16.3.94',
      port: process.env.PROD_SERVER_PORT || 22,
      username: process.env.PROD_SERVER_USER || 'admin',
    }
  };

  // ============================================
  // VALIDACIONES
  // ============================================

  let errors = 0;
  let warnings = 0;

  console.log('📋 Validando archivos críticos del sistema...\\n');

  // 1. Verificar archivos esenciales
  const criticalFiles = [
    { path: 'gulpfile.js', desc: 'Gulp - Automatización' },
    { path: 'scripts/generate-environment.js', desc: 'Generador de environments' },
    { path: 'package.json', desc: 'Configuración NPM' },
    { path: 'angular.json', desc: 'Configuración Angular' },
  ];

  criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file.path);
    if (fs.existsSync(filePath)) {
    console.log('  ✓ ' + file.desc.padEnd(40) + ' ' + file.path);
  } else {
    console.log('  ✗ ' + file.desc.padEnd(40) + ' ' + file.path + ' [FALTA]');
    errors++;
  }
  });

  console.log('\\n' + '-'.repeat(70) + '\\n');

  // 2. Verificar package.json scripts
  console.log('📦 Validando scripts de deploy en package.json...\\n');

  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const requiredScripts = [
    { name: 'deploy', task: 'node scripts/deploy.js' },
    { name: 'deploy:calidad', task: 'node scripts/deploy.js calidad' },
    { name: 'deploy:prod', task: 'node scripts/deploy.js prod' },
    { name: 'verify', task: 'node verify-config.js' },
    { name: 'validate', task: 'node scripts/validate-all-environments.js' },
  ];

  requiredScripts.forEach(script => {
  if (packageJson.scripts[script.name] === script.task) {
    console.log('  ✓ ' + script.name.padEnd(20) + ' → ' + script.task);
  } else if (packageJson.scripts[script.name]) {
    console.log('  ⚠ ' + script.name.padEnd(20) + ' → ' + packageJson.scripts[script.name] + ' [DIFERENTE]');
    warnings++;
  } else {
    console.log('  ✗ ' + script.name.padEnd(20) + ' [FALTA]');
    errors++;
  }
});

  console.log('\\n' + '-'.repeat(70) + '\\n');

  // 3. Validar configuraciones de servidor
  console.log('🖥️  Validando configuraciones de servidores SSH...\\n');

  Object.entries(servers).forEach(([env, config]) => {
  console.log('  ' + env.toUpperCase() + ': ');
  console.log('    Host: ' + config.host);
  console.log('    Puerto SSH: ' + config.port);
  console.log('    Usuario: ' + config.username);

  if (!config.host || config.host === '') {
    console.log('    ✗ ERROR: Host no configurado');
    errors++;
  }
  if (!config.username || config.username === '') {
    console.log('    ⚠ ADVERTENCIA: Usuario no configurado');
    warnings++;
  }
  console.log('');
});

  console.log('-'.repeat(70) + '\\n');

  // 4. Validar entornos en generate-environment.js
  console.log('🔧 Validando configuraciones de entornos...\\n');

  const generateEnvPath = path.join(__dirname, 'generate-environment.js');
  const generateEnvContent = fs.readFileSync(generateEnvPath, 'utf8');

  environments.forEach(env => {
    // Las configs se crean dinámicamente con configs[key] = {...}
    if (generateEnvContent.includes("configs['" + env + "']") ||
      generateEnvContent.includes('configs["' + env + '"]') ||
      generateEnvContent.includes("key === '" + env + "'") ||
      (env.startsWith('dev') && generateEnvContent.includes('forEach(port =>'))) {
    console.log('  ✓ ' + env.padEnd(15) + ' - Configurado');
  } else {
    console.log('  ✗ ' + env.padEnd(15) + ' - [FALTA EN generate-environment.js]');
    errors++;
  }
});

  console.log('\\n' + '-'.repeat(70) + '\\n');

  // 5. Verificar dependencias
  console.log('📚 Validando dependencias críticas...\\n');

  const criticalDeps = [
    'gulp',
    'ssh2',
    'archiver',
    'dotenv',
    '@angular/core',
    '@angular/cli'
  ];

  criticalDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      const version = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
    console.log('  ✓ ' + dep.padEnd(25) + ' ' + version);
  } else {
    console.log('  ✗ ' + dep.padEnd(25) + ' [NO INSTALADO]');
    errors++;
  }
});

  console.log('\\n' + '-'.repeat(70) + '\\n');

  // 6. Verificar estructura de directorios
  console.log('📁 Validando estructura de directorios...\\n');

  const requiredDirs = [
    { path: 'src', desc: 'Código fuente' },
    { path: 'src/environments', desc: 'Configuraciones de entorno' },
    { path: 'src/app', desc: 'Aplicación Angular' },
    { path: 'scripts', desc: 'Scripts de utilidad' },
    { path: 'backups', desc: 'Backups remotos', optional: true },
  ];

  requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir.path);
    if (fs.existsSync(dirPath)) {
    console.log('  ✓ ' + dir.desc.padEnd(30) + ' ' + dir.path + '/');
  } else if (dir.optional) {
  console.log('  ⚠ ' + dir.desc.padEnd(30) + ' ' + dir.path + '/ [OPCIONAL - Se creará automáticamente]');
} else {
  console.log('  ✗ ' + dir.desc.padEnd(30) + ' ' + dir.path + '/ [FALTA]');
  errors++;
}
  });

// ============================================
// RESUMEN FINAL
// ============================================

console.log('\\n' + '='.repeat(70));
console.log('📊 RESUMEN DE VALIDACIÓN');
console.log('='.repeat(70) + '\\n');

console.log('  Total de entornos validados: ' + environments.length);
console.log('  Archivos críticos verificados: ' + criticalFiles.length);
console.log('  Scripts de deploy verificados: ' + requiredScripts.length);
console.log('  Dependencias verificadas: ' + criticalDeps.length + '\\n');

if (errors === 0 && warnings === 0) {
  console.log('  ✅ PERFECTO: Todo está correctamente configurado\\n');
  console.log('  🚀 El sistema está listo para despliegue en todos los entornos\\n');
  console.log('='.repeat(70) + '\\n');
  process.exit(0);
} else {
  if (errors > 0) {
    console.log('  ❌ ERRORES CRÍTICOS: ' + errors);
  }
  if (warnings > 0) {
    console.log('  ⚠  ADVERTENCIAS: ' + warnings);
  }
  console.log('\\n  📝 Revisa los errores anteriores y corrígelos antes de continuar\\n');
  console.log('='.repeat(70) + '\\n');
  process.exit(errors > 0 ? 1 : 0);
}
`;

  fs.writeFileSync('scripts/validate-all-environments.js', content);
}

function generateTestScript() {
  const content = `#!/usr/bin / env node

/**
 * SCRIPT DE PRUEBA RÁPIDA DE ENTORNOS
 *
 * Prueba la generación de environment para cada entorno sin hacer build completo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\\n' + '='.repeat(70));
console.log('🧪 PRUEBA RÁPIDA DE GENERACIÓN DE ENVIRONMENTS');
console.log('='.repeat(70) + '\\n');

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

console.log('Probando generación de environment para cada entorno...\\n');

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

console.log('\\n' + '='.repeat(70));
console.log('📊 RESUMEN');
console.log('='.repeat(70) + '\\n');

console.log('  Total probados: ' + environments.length);
console.log('  ✅ Exitosos: ' + success);
console.log('  ❌ Fallidos: ' + failed + '\\n');

if (failed === 0) {
  console.log('  🎉 PERFECTO: Todos los entornos funcionan correctamente\\n');
  console.log('  💡 Puedes hacer deploy con confianza usando:');
  console.log('     npm run deploy -- 80');
  console.log('     npm run deploy -- 8080');
  console.log('     npm run deploy -- calidad');
  console.log('     npm run deploy -- prod\\n');
  console.log('='.repeat(70) + '\\n');

  // Restaurar environment original (dev80)
  console.log('🔄 Restaurando environment a dev80 (predeterminado)...\\n');
  execSync('node scripts/generate-environment.js dev80', { stdio: 'inherit' });

  process.exit(0);
} else {
  console.log('  ⚠️  ATENCIÓN: Algunos entornos fallaron\\n');
  console.log('  Revisa los errores anteriores antes de continuar\\n');
  console.log('='.repeat(70) + '\\n');
  process.exit(1);
}
`;

  fs.writeFileSync('scripts/test-all-environments.js', content);
}

function generateBuildScript(buildOutput) {
  const content = `#!/usr/bin / env node

/**
 * SCRIPT DE BUILD DINÁMICO
 * 
 * Genera el environment para el entorno especificado y compila el proyecto.
 * 
 * Uso: 
 *   npm run build:env          → Menú interactivo
 *   npm run build:env -- 80    → Build para puerto 80
 *   npm run build:env -- 8080  → Build para puerto 8080
 *   npm run build:env -- prod  → Build para producción
 */

const { spawnSync } = require('child_process');
const readline = require('readline');
const { BASE_HREF, DEV_PORTS, DIST_PATH, ENVIRONMENTS } = require('./shared-config');

// Mapeo de entornos para generate-environment.js
const ENV_MAP = {};
DEV_PORTS.forEach(port => {
  const key = port === 80 ? 'dev80' : 'dev' + port;
  ENV_MAP[String(port)] = key;
});
ENV_MAP['calidad'] = 'calidad';
ENV_MAP['prod'] = 'production';
ENV_MAP['production'] = 'production';

const BUILD_CONFIGURATION = 'production';

function showMenu() {
  console.log('\\n============================================================');
  console.log('🔨 BUILD DINÁMICO - Selecciona entorno');
  console.log('============================================================\\n');

  console.log('📦 DESARROLLO:');
  console.log('   80, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089\\n');

  console.log('🏢 STAGING:');
  console.log('   calidad\\n');

  console.log('⚠️  PRODUCCIÓN:');
  console.log('   prod\\n');

  console.log('------------------------------------------------------------');
}

function build(envArg) {
  const envKey = ENV_MAP[envArg];

  if (!envKey) {
    console.log('\\n❌ Entorno no válido: ' + envArg);
    console.log('   Opciones: 80, 8080-8089, calidad, prod\\n');
    process.exit(1);
  }

  const envName = ENVIRONMENTS[envArg]?.name || envArg;
  console.log('\\n🔨 Compilando para: ' + envName);
  console.log('============================================================\\n');

  // Paso 1: Generar environment
  console.log('[1/2] Generando environment...\\n');
  const genResult = spawnSync('node', ['scripts/generate-environment.js', envKey], {
    stdio: 'inherit',
    shell: true
  });

  if (genResult.status !== 0) {
    console.error('\\n❌ Error generando environment');
    process.exit(1);
  }

  // Paso 2: Ejecutar NG Build
  console.log('◼ Building...');

    try {
      const buildResult = spawnSync(
        'npx',
        ['ng', 'build', '--configuration', BUILD_CONFIGURATION, '--base-href', BASE_HREF],
        { stdio: 'inherit', shell: true }
      );

      if (buildResult.status !== 0) {
        console.error('\\n❌ Error en compilación');
        process.exit(1);
      }
    } catch (error) {
      console.error('\\n❌ Error en compilación:', error);
      process.exit(1);
    }

    console.log('\\n✅ Build completado exitosamente');
    console.log('📁 Archivos en: ' + '${buildOutput}' + '/browser\\n');
  }

  function main() {
    const arg = process.argv[2];

    if (arg) {
      build(arg);
      return;
    }

    // Modo interactivo
    showMenu();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('🔌 ¿Para qué entorno compilar?: ', (answer) => {
      rl.close();
      const env = answer.trim().toLowerCase();

      if (!env) {
        console.log('\\n⚠️  No se especificó entorno. Cancelando.\\n');
        process.exit(0);
      }

      build(env);
    });
  }

  main();
  `;

  fs.writeFileSync('scripts/build.js', content);
}

// ============================================
// DEPRECATED v4.2: ACTUALIZACIÓN DE APP COMPONENT
// Esta función fue reemplazada por generateAppConfig()
// El logging ahora se maneja via APP_INITIALIZER en app.config.ts
// Se mantiene por compatibilidad pero no hace nada
// ============================================

function updateAppComponent() {
  // DEPRECATED v4.2: Esta función ya no realiza cambios.
  // Ver generateAppConfig() para la nueva implementación.
  console.log('ℹ️  [DEPRECATED] updateAppComponent() - usar generateAppConfig()');
}

// ============================================
// EJECUTAR
// ============================================

main().catch(err => {
  console.error('[ERROR]', err.message);
  rl.close();
  process.exit(1);
});
