/**
 * GULPFILE - Sistema de Deploy Automatizado
 * Generated for: login-general
 */

const gulp = require('gulp');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const clean = require('gulp-clean');
const dotenv = require('dotenv');
const {
  APP_NAME,
  BASE_HREF,
  DEV_PORTS,
  DIST_PATH,
  SERVERS
} = require('./scripts/shared-config');

dotenv.config();

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
  DIST_PATH,
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
  DEV_PORTS
};

// ============================================
// CONFIGURACIÓN DE SERVIDORES WINDOWS
// ============================================

const servers = SERVERS;

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
  const targetApiPort = process.env.TARGET_API_PORT;
  const targetApiHost = process.env.TARGET_API_HOST;

  console.log(`[BUILD] Target: ${targetEnv}`);
  if (targetApiHost) {
    console.log(`[BUILD] API Host override: ${targetApiHost}`);
  }
  if (targetApiPort) {
    console.log(`[BUILD] API Port override: ${targetApiPort}`);
  }

  // Generar environment con overrides opcionales
  const generatorArgs = ['scripts/generate-environment.js', targetEnv];
  if (targetApiHost) generatorArgs.push(`--api-host=${targetApiHost}`);
  if (targetApiPort) generatorArgs.push(`--api-port=${targetApiPort}`);

  const result = spawnSync('node', generatorArgs, {
    stdio: 'inherit',
    shell: true
  });

  if (result.status !== 0) {
    console.error(`[ERROR] Environment generation failed (code: ${result.status})`);
    done(new Error('Error generando environment'));
    return;
  }

  // Compilar con Angular
  console.log('[BUILD] Compiling Angular...');

  try {
    execSync(`ng build --configuration production --base-href ${BASE_HREF}`, {
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
        console.log(`⚠️ No se pudo crear/verificar después de ${maxAttempts} intentos: ${remotePath}`);
        callback(false);
        return;
      }

      // Stat falló, reintentar con mkdir
      console.log(`🔄 Reintentando mkdir (${attempts}/${maxAttempts})...`);
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
        const remotePath = remoteDir.replace(/\\/g, '/') + '/' + item.file;
        console.log(`📁 Procesando carpeta: ${item.file}`);

        // Intentar crear el directorio
        sftp.mkdir(remotePath, { mode: 0o755 }, (err) => {
          if (err) {
            const isIgnorable = CONFIG.SFTP_IGNORABLE_CODES.includes(err.code) ||
              err.message === 'Failure' ||
              err.message === 'Bad message';
            if (!isIgnorable) {
              console.log(`⚠️ Error al crear ${item.file}: ${err.message}`);
            }
          }

          // CRÍTICO: Verificar que el directorio existe antes de continuar
          ensureDirectoryExists(sftp, remotePath, (exists) => {
            if (!exists) {
              console.log(`❌ Directorio ${item.file} no pudo ser creado/verificado`);
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
            callback(errorCount > 0 ? new Error(`${errorCount} archivos fallaron`) : null);
            return;
          }

          const item = regularFiles[fileIndex];
          const remotePath = remoteDir.replace(/\\/g, '/') + '/' + item.file;

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
            console.log(`✓ ${fileName}`);
            onComplete();
          } else if (retryCount < CONFIG.SFTP_RETRY_COUNT) {
            setTimeout(() => {
              uploadFileWithRetry(localPath, remotePath, fileName, retryCount + 1, onComplete);
            }, CONFIG.SFTP_RETRY_DELAY_MS);
          } else {
            console.error(`✗ ${fileName} - ${err.message || 'Error'} (después de ${CONFIG.SFTP_RETRY_COUNT} reintentos)`);
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
  const normalizedPath = remotePath.replace(/\\\\/g, '/');
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
          console.log(`⚠️ ${errors} elementos fallaron, reintentando (pasada ${passNumber + 1}/${maxPasses})...`);
          setTimeout(() => {
            cleanRemoteDir(sftp, remotePath, callback, passNumber + 1);
          }, 1000);
        } else if (errors > 0) {
          console.log(`⚠️ ${errors} elementos no se pudieron eliminar después de ${maxPasses} pasadas`);
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
      reject(new Error(`Entorno no encontrado: ${environment}`));
      return;
    }

    let remotePath = config.remotePath;
    if (environment === 'desarrollo' && folderName) {
      remotePath = `C:\\inetpub\\wwwroot\\app_${folderName}\\${APP_NAME}`;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}`;
    const backupDir = path.join(__dirname, CONFIG.BACKUP_TEMP_DIR, backupName);
    const backupZip = path.join(__dirname, CONFIG.BACKUP_DIR, `${backupName}.zip`);
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
            console.log(`⚠ Aviso: No se pudo crear backup (continuando)`);
            resolve();
          }
          return;
        }

        console.log(`Descargando archivos del servidor para backup: ${remotePath}`);

        const downloadDir = (remoteDir, localDir) => {
          return new Promise((resolveDir) => {
            sftp.readdir(remoteDir, (err, list) => {
              if (err) {
                console.log(`⚠ Carpeta vacía o no accesible: ${remoteDir}`);
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

        downloadDir(remotePath.replace(/\\/g, '/'), backupDir)
          .then(() => {
            const output = fs.createWriteStream(backupZip);
            const archive = archiver('zip', { zlib: { level: 6 } });

            output.on('close', () => {
              const fileSizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
              console.log(`✓ Backup creado: ${backupName}.zip (${fileSizeMB} MB)`);
              console.log(`  Ubicación: ${backupZip}`);

              try {
                const { execSync } = require('child_process');
                execSync(`rmdir /s /q "${backupDir}"`, { windowsHide: true });
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
                console.log(`⚠ Aviso: Error al crear ZIP (continuando)`);
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
        console.log(`⚠ Aviso: Error SSH (continuando sin backup)`);
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
        console.log(`⚠ Aviso: Timeout en backup (continuando)`);
        resolve();
      }
    }, CONFIG.BACKUP_TIMEOUT_MS);
  });
}

// ============================================
// FUNCIÓN PARA ASEGURAR DIRECTORIO RAÍZ
// ============================================

function normalizeSftpPath(remotePath) {
  return remotePath.replace(/\\/g, '/');
}

function formatSftpError(err) {
  if (!err) return 'sin error';
  const code = err.code !== undefined ? `code=${err.code}` : 'code=n/a';
  const message = err.message || 'sin mensaje';
  return `${code}, msg=${message}`;
}

function pathCandidates(pathValue) {
  const normalized = normalizeSftpPath(pathValue);
  const candidates = [];
  const pushCandidate = (value) => {
    const cleaned = normalizeSftpPath(value).replace(/\/+/g, '/');
    if (!cleaned) return;
    if (!candidates.includes(cleaned)) {
      candidates.push(cleaned);
    }
  };

  pushCandidate(normalized);
  pushCandidate(normalized.startsWith('/') ? normalized : `/${normalized}`);

  const iisMarker = '/inetpub/wwwroot/';
  const normalizedLower = normalized.toLowerCase();
  const markerIndex = normalizedLower.indexOf(iisMarker);
  if (markerIndex >= 0) {
    const relativeTail = normalized.slice(markerIndex + iisMarker.length).replace(/^\/+/, '');
    if (relativeTail) {
      pushCandidate(`/${relativeTail}`);
      pushCandidate(relativeTail);
    }
  }

  return candidates;
}

function statOrReadDir(sftp, remotePath, callback) {
  sftp.stat(remotePath, (statErr, stats) => {
    if (!statErr && stats) {
      callback(true, null);
      return;
    }

    sftp.readdir(remotePath, (readErr) => {
      callback(!readErr, statErr || readErr);
    });
  });
}

function resolveBasePathStyle(sftp, basePath, callback) {
  const candidates = pathCandidates(basePath);
  let index = 0;

  function next() {
    if (index >= candidates.length) {
      callback(candidates[0], false);
      return;
    }

    const candidate = candidates[index++];
    statOrReadDir(sftp, candidate, (ok, err) => {
      if (ok) {
        callback(candidate, true);
        return;
      }

      if (index === candidates.length) {
        console.log(`⚠️ No se pudo validar base ${candidate}: ${formatSftpError(err)}`);
      }
      next();
    });
  }

  next();
}

function splitPathPlan(targetPath) {
  const normalized = normalizeSftpPath(targetPath).replace(/\/+/g, '/');
  const isDrivePath = /^\/?[A-Za-z]:\//.test(normalized);

  if (isDrivePath) {
    const hasLeadingSlash = normalized.startsWith('/');
    const withoutLeadingSlash = hasLeadingSlash ? normalized.slice(1) : normalized;
    const parts = withoutLeadingSlash.split('/').filter(Boolean);
    const drive = parts.shift() || 'C:';

    let base = hasLeadingSlash ? `/${drive}` : drive;
    let dirs = parts;

    const lower = parts.map(p => p.toLowerCase());
    for (let i = 0; i < lower.length - 1; i++) {
      if (lower[i] === 'inetpub' && lower[i + 1] === 'wwwroot') {
        const baseSegments = parts.slice(0, i + 2);
        dirs = parts.slice(i + 2);
        base += '/' + baseSegments.join('/');
        return { targetPath: normalized, basePath: base, dirsToCreate: dirs };
      }
    }

    return { targetPath: normalized, basePath: base, dirsToCreate: dirs };
  }

  if (normalized.startsWith('/')) {
    return {
      targetPath: normalized,
      basePath: '/',
      dirsToCreate: normalized.split('/').filter(Boolean)
    };
  }

  return {
    targetPath: normalized,
    basePath: '/',
    dirsToCreate: normalized.split('/').filter(Boolean)
  };
}

function ensureRootDir(sftp, remotePath, callback) {
  const candidates = pathCandidates(remotePath).map(splitPathPlan);
  let selectedPlan = candidates[0];
  let planIndex = 0;

  function validateCandidatePlan(next) {
    if (planIndex >= candidates.length) {
      next();
      return;
    }

    const plan = candidates[planIndex++];
    statOrReadDir(sftp, plan.basePath, (ok, err) => {
      if (ok) {
        selectedPlan = plan;
        console.log(`✓ Base remota detectada: ${plan.basePath}`);
        next();
        return;
      }

      if (planIndex === candidates.length) {
        console.log(`⚠️ Base no accesible (${plan.basePath}): ${formatSftpError(err)}`);
      }
      validateCandidatePlan(next);
    });
  }

  validateCandidatePlan(() => {
    const dirsToCreate = selectedPlan.dirsToCreate;
    let currentPath = selectedPlan.basePath === '/' ? '' : selectedPlan.basePath;
    let dirIndex = 0;

    console.log(`📂 Creando estructura: ${dirsToCreate.join('/')}`);

    function createNextDir() {
      if (dirIndex >= dirsToCreate.length) {
        const finalPath = currentPath || '/';
        console.log(`✓ Estructura de directorios verificada: ${finalPath}`);
        callback(finalPath, true);
        return;
      }

      currentPath = `${currentPath}/${dirsToCreate[dirIndex]}`.replace(/\/+/g, '/');

      ensureDirectoryExistsRobust(sftp, currentPath, (success, resolvedPath) => {
        if (resolvedPath) currentPath = resolvedPath;

        if (!success) {
          console.log(`❌ No se pudo crear/verificar: ${currentPath}`);
          callback(currentPath, false);
          return;
        }

        dirIndex++;
        createNextDir();
      });
    }

    createNextDir();
  });
}

/**
 * Versión robusta para el directorio raíz con más intentos y delays más largos
 * OPTIMIZACIÓN: Primero verifica si el directorio ya existe para evitar reintentos innecesarios
 */
function ensureDirectoryExistsRobust(sftp, remotePath, callback) {
  const candidates = pathCandidates(remotePath);
  const maxAttempts = 3;
  const mkdirDelay = 350;
  const retryDelay = 350;
  let candidateIndex = 0;

  function tryCandidate(candidatePath) {
    // PASO 1: Verificar si el directorio ya existe
    statOrReadDir(sftp, candidatePath, (exists, existsErr) => {
      if (exists) {
        callback(true, candidatePath);
        return;
      }

      let attempts = 0;

      function attemptCreate() {
        attempts++;

        sftp.mkdir(candidatePath, { mode: 0o755 }, (mkdirErr) => {
          if (mkdirErr && (mkdirErr.code === 3 || mkdirErr.code === 2)) {
            console.log(`❌ Error no recuperable creando ${candidatePath}: ${formatSftpError(mkdirErr)}`);
            callback(false, candidatePath);
            return;
          }

          if (mkdirErr && attempts === 1) {
            console.log(`⚠️ mkdir inicial ${candidatePath}: ${formatSftpError(mkdirErr)}`);
          }

          setTimeout(verify, mkdirDelay);
        });
      }

      function verify() {
        statOrReadDir(sftp, candidatePath, (ok, verifyErr) => {
          if (ok) {
            callback(true, candidatePath);
            return;
          }

          if (verifyErr && verifyErr.code === 3) {
            console.log(`❌ Permiso denegado verificando ${candidatePath}: ${formatSftpError(verifyErr)}`);
            callback(false, candidatePath);
            return;
          }

          if (attempts >= maxAttempts) {
            if (candidateIndex < candidates.length) {
              const nextPath = candidates[candidateIndex++];
              console.log(`⚠️ Falló ${candidatePath}: ${formatSftpError(verifyErr)}. Probando ${nextPath}...`);
              tryCandidate(nextPath);
              return;
            }

            console.log(`⚠️ No se pudo crear/verificar (${maxAttempts} intentos): ${candidatePath}`);
            console.log(`   Último error: ${formatSftpError(verifyErr || existsErr)}`);
            callback(false, candidatePath);
            return;
          }

          console.log(`🔄 Reintentando (${attempts}/${maxAttempts}): ${candidatePath}`);
          setTimeout(attemptCreate, retryDelay);
        });
      }

      attemptCreate();
    });
  }

  const firstPath = candidates[candidateIndex++];
  tryCandidate(firstPath);
}

// ============================================
// FUNCIÓN DE DEPLOY
// ============================================

function deploySSH(environment, folderName = null) {
  return new Promise((resolve, reject) => {
    const config = servers[environment];
    if (!config) {
      reject(new Error(`Entorno no encontrado: ${environment}`));
      return;
    }

    let remotePath = config.remotePath;
    if (environment === 'desarrollo' && folderName) {
      remotePath = `C:\\inetpub\\wwwroot\\app_${folderName}\\${APP_NAME}`;
    }

    const localPath = path.resolve(CONFIG.DIST_PATH);
    let isCompleted = false;

    const complete = (err) => {
      if (isCompleted) return;
      isCompleted = true;
      if (err) {
        console.log('\n❌ Deploy fallido');
        reject(err);
      } else {
        console.log('\n✅ Deploy OK');
        resolve();
      }
    };

    console.log(`🚀 ${environment} → ${remotePath}`);

    const conn = new Client();

    conn.on('ready', function () {

      conn.sftp((err, sftp) => {
        if (err) {
          conn.end();
          complete(err);
          return;
        }

        // Verificar/crear directorio y subir
        ensureRootDir(sftp, remotePath, (resolvedRemotePath, ready) => {
          if (!ready) {
            conn.end();
            complete(new Error(`No se pudo preparar directorio remoto: ${resolvedRemotePath}`));
            return;
          }

          // Limpiar archivos antiguos antes de subir los nuevos
          cleanRemoteDir(sftp, resolvedRemotePath, () => {
            console.log(`📤 Subiendo archivos...`);
            // Delay para que SFTP reconozca el directorio
            setTimeout(() => {
              uploadFiles(sftp, localPath, resolvedRemotePath, (uploadErr) => {
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

    console.log(`[DEBUG] Connecting to ${config.host}:${config.port} as ${config.username}`);
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
  const envName = port === 80 ? 'dev80' : `dev${port}`;

  gulp.task(`deploy:ssh:dev:${portStr}`, () => deploySSH('desarrollo', portStr));

  gulp.task(`build:dev:${portStr}`, gulp.series(
    'clean:dist',
    function setTargetEnv(done) {
      process.env.TARGET_ENV = envName;
      done();
    },
    'build:with-env',
    `deploy:ssh:dev:${portStr}`,
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
