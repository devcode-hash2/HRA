#!/usr/bin/env node
/**
 * SCRIPT DE DIAGNÓSTICO SFTP
 * 
 * Prueba las operaciones SFTP individuales para identificar
 * qué comandos fallan en el servidor Windows.
 * 
 * Uso: node scripts/test-sftp.js
 */

const { Client } = require('ssh2');
const dotenv = require('dotenv');

dotenv.config();

const config = {
    host: process.env.DEV_SERVER_HOST || '10.100.6.24',
    port: parseInt(process.env.DEV_SERVER_PORT || '22', 10),
    username: process.env.DEV_SERVER_USER || 'admin',
    password: process.env.DEV_SERVER_PASS || ''
};

const TEST_DIR = 'C:/inetpub/wwwroot/app_80';
const TEST_SUBDIR = 'C:/inetpub/wwwroot/app_80/_test_sftp_diag';

console.log('='.repeat(60));
console.log('🔍 DIAGNÓSTICO SFTP - Servidor Windows');
console.log('='.repeat(60));
console.log(`Host: ${config.host}:${config.port}`);
console.log(`Usuario: ${config.username}`);
console.log(`Password: ${config.password ? '***' : '(vacío)'}`);
console.log('='.repeat(60));
console.log('');

const conn = new Client();
const results = [];

function logResult(test, success, details = '', duration = 0) {
    const icon = success ? '✅' : '❌';
    const dur = duration > 0 ? ` (${duration}ms)` : '';
    console.log(`${icon} ${test}${dur}`);
    if (details) console.log(`   └─ ${details}`);
    results.push({ test, success, details, duration });
}

function runTests(sftp) {
    return new Promise((resolve) => {
        console.log('📋 Ejecutando pruebas...\n');

        // Test 1: stat en directorio existente conocido
        const t1Start = Date.now();
        sftp.stat('C:/inetpub/wwwroot', (err, stats) => {
            logResult(
                'stat() en C:/inetpub/wwwroot',
                !err,
                err ? `Error: code=${err.code}, msg=${err.message}` : `Tipo: ${stats?.isDirectory() ? 'directorio' : 'archivo'}`,
                Date.now() - t1Start
            );

            // Test 2: stat en directorio de la app
            const t2Start = Date.now();
            sftp.stat(TEST_DIR, (err, stats) => {
                logResult(
                    `stat() en ${TEST_DIR}`,
                    !err,
                    err ? `Error: code=${err.code}, msg=${err.message}` : `Tipo: ${stats?.isDirectory() ? 'directorio' : 'archivo'}`,
                    Date.now() - t2Start
                );

                // Test 3: readdir en directorio padre
                const t3Start = Date.now();
                sftp.readdir('C:/inetpub/wwwroot', (err, list) => {
                    logResult(
                        'readdir() en C:/inetpub/wwwroot',
                        !err,
                        err ? `Error: code=${err.code}, msg=${err.message}` : `Encontrados: ${list?.length || 0} items`,
                        Date.now() - t3Start
                    );

                    // Test 4: mkdir - crear directorio de prueba
                    const t4Start = Date.now();
                    sftp.mkdir(TEST_SUBDIR, { mode: 0o755 }, (err) => {
                        logResult(
                            `mkdir() en ${TEST_SUBDIR}`,
                            !err || err.code === 4,
                            err ? `Error: code=${err.code}, msg=${err.message}` : 'Creado OK',
                            Date.now() - t4Start
                        );

                        // Test 5: stat inmediato después de mkdir (sin delay)
                        const t5Start = Date.now();
                        sftp.stat(TEST_SUBDIR, (err, stats) => {
                            logResult(
                                'stat() inmediato después de mkdir',
                                !err,
                                err ? `Error: code=${err.code}, msg=${err.message}` : 'Encontrado OK',
                                Date.now() - t5Start
                            );

                            // Test 6: stat con delay de 1 segundo
                            console.log('   ⏳ Esperando 1 segundo...');
                            setTimeout(() => {
                                const t6Start = Date.now();
                                sftp.stat(TEST_SUBDIR, (err, stats) => {
                                    logResult(
                                        'stat() después de 1s delay',
                                        !err,
                                        err ? `Error: code=${err.code}, msg=${err.message}` : 'Encontrado OK',
                                        Date.now() - t6Start
                                    );

                                    // Test 7: stat con delay de 3 segundos
                                    console.log('   ⏳ Esperando 3 segundos...');
                                    setTimeout(() => {
                                        const t7Start = Date.now();
                                        sftp.stat(TEST_SUBDIR, (err, stats) => {
                                            logResult(
                                                'stat() después de 3s delay',
                                                !err,
                                                err ? `Error: code=${err.code}, msg=${err.message}` : 'Encontrado OK',
                                                Date.now() - t7Start
                                            );

                                            // Test 8: readdir en padre para verificar existencia
                                            const t8Start = Date.now();
                                            sftp.readdir(TEST_DIR, (err, list) => {
                                                const exists = list?.some(f => f.filename === '_test_sftp_diag');
                                                logResult(
                                                    'readdir() padre para verificar dir hijo',
                                                    exists !== undefined && (exists || !err),
                                                    exists ? 'Dir existe en listado' : (err ? `Error: ${err.message}` : 'Dir NO existe en listado'),
                                                    Date.now() - t8Start
                                                );

                                                // Test 9: rmdir - limpiar
                                                const t9Start = Date.now();
                                                sftp.rmdir(TEST_SUBDIR, (err) => {
                                                    logResult(
                                                        'rmdir() limpiar directorio de prueba',
                                                        !err,
                                                        err ? `Error: code=${err.code}, msg=${err.message}` : 'Eliminado OK',
                                                        Date.now() - t9Start
                                                    );

                                                    resolve();
                                                });
                                            });
                                        });
                                    }, 3000);
                                });
                            }, 1000);
                        });
                    });
                });
            });
        });
    });
}

conn.on('ready', async () => {
    logResult('Conexión SSH establecida', true);

    conn.sftp((err, sftp) => {
        if (err) {
            logResult('Iniciar sesión SFTP', false, err.message);
            conn.end();
            process.exit(1);
        }

        logResult('Sesión SFTP iniciada', true);
        console.log('');

        runTests(sftp).then(() => {
            console.log('\n' + '='.repeat(60));
            console.log('📊 RESUMEN DE RESULTADOS');
            console.log('='.repeat(60));

            const passed = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;

            console.log(`✅ Pasaron: ${passed}`);
            console.log(`❌ Fallaron: ${failed}`);

            if (failed > 0) {
                console.log('\n🔍 Pruebas fallidas:');
                results.filter(r => !r.success).forEach(r => {
                    console.log(`   - ${r.test}: ${r.details}`);
                });
            }

            // Análisis
            console.log('\n💡 ANÁLISIS:');

            const statImmediateFailed = results.find(r => r.test.includes('stat() inmediato') && !r.success);
            const statDelayedPassed = results.find(r => r.test.includes('stat() después') && r.success);
            const readdirPassed = results.find(r => r.test.includes('readdir() padre') && r.success);

            if (statImmediateFailed && statDelayedPassed) {
                console.log('   ⚠️ stat() falla inmediatamente después de mkdir pero funciona con delay');
                console.log('   → Solución: Aumentar mkdirDelay en gulpfile.js');
            }

            if (statImmediateFailed && readdirPassed) {
                console.log('   ⚠️ stat() falla pero readdir() padre funciona');
                console.log('   → Solución: Usar readdir() en lugar de stat() para verificar directorios');
            }

            const allStatFailed = results.filter(r => r.test.includes('stat()') && !r.success).length > 2;
            if (allStatFailed) {
                console.log('   🚫 stat() falla consistentemente en este servidor');
                console.log('   → Solución: Cambiar estrategia de verificación a readdir() o asumir éxito');
            }

            console.log('');
            conn.end();
            process.exit(failed > 0 ? 1 : 0);
        });
    });
});

conn.on('error', (err) => {
    logResult('Conexión SSH', false, err.message);
    process.exit(1);
});

console.log('🔌 Conectando...\n');
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
