// Script para probar los endpoints de la API
// Ejecutar: node test/api-test.js

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Configuración
const API_BASE_URL = 'http://localhost:3000/api';
// Para producción: const API_BASE_URL = 'https://tu-app.vercel.app/api';

class APITester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000
    });
  }

  async testHealthCheck() {
    console.log('🏥 Probando Health Check...');
    try {
      const response = await this.client.get('/health');
      console.log('✅ Health Check OK:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Health Check falló:', error.response?.data || error.message);
      return false;
    }
  }

  async testGetLatestVersion() {
    console.log('\n📱 Probando obtener última versión...');
    try {
      const response = await this.client.get('/version/latest');
      console.log('✅ Última versión:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error obteniendo última versión:', error.response?.data || error.message);
      return null;
    }
  }

  async testCompareVersion(currentVersion = '1.0.0') {
    console.log(`\n🔄 Probando comparación con versión ${currentVersion}...`);
    try {
      const response = await this.client.get(`/version/compare/${currentVersion}`);
      console.log('✅ Comparación:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en comparación:', error.response?.data || error.message);
      return null;
    }
  }

  async testListVersions() {
    console.log('\n📋 Probando listar todas las versiones...');
    try {
      const response = await this.client.get('/versions');
      console.log('✅ Versiones disponibles:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error listando versiones:', error.response?.data || error.message);
      return null;
    }
  }

  async testDownload(version) {
    console.log(`\n⬇️ Probando descarga de versión ${version}...`);
    try {
      const response = await this.client.get(`/download/${version}`, {
        responseType: 'stream'
      });
      
      console.log('✅ Descarga iniciada');
      console.log('   Content-Type:', response.headers['content-type']);
      console.log('   Content-Length:', response.headers['content-length']);
      console.log('   Content-Disposition:', response.headers['content-disposition']);
      
      // No descargar completamente, solo verificar headers
      response.data.destroy();
      return true;
    } catch (error) {
      console.error('❌ Error en descarga:', error.response?.data || error.message);
      return false;
    }
  }

  async testUpload() {
    console.log('\n⬆️ Probando subida de nueva versión...');
    
    // Crear un archivo APK simulado para pruebas
    const fakeApkContent = Buffer.from('PK\x03\x04'); // Simula inicio de archivo ZIP/APK
    const testApkPath = '/tmp/test-zodiac-app.apk';
    
    try {
      // Crear archivo temporal
      fs.writeFileSync(testApkPath, fakeApkContent);
      
      const form = new FormData();
      form.append('apk', fs.createReadStream(testApkPath));
      form.append('version', '2.0.0-test');
      form.append('releaseNotes', 'Versión de prueba creada por script automatizado');
      form.append('minAndroidVersion', '6.0');
      form.append('targetSdkVersion', '33');

      const response = await this.client.post('/upload', form, {
        headers: {
          ...form.getHeaders()
        }
      });

      console.log('✅ Subida exitosa:', response.data);
      
      // Limpiar archivo temporal
      fs.unlinkSync(testApkPath);
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Error en subida:', error.response?.data || error.message);
      
      // Limpiar archivo temporal en caso de error
      if (fs.existsSync(testApkPath)) {
        fs.unlinkSync(testApkPath);
      }
      
      return null;
    }
  }

  async testDelete(version) {
    console.log(`\n🗑️ Probando eliminación de versión ${version}...`);
    try {
      const response = await this.client.delete(`/version/${version}`);
      console.log('✅ Eliminación exitosa:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Error en eliminación:', error.response?.data || error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Iniciando pruebas de API...\n');
    console.log('=' .repeat(50));

    const results = {
      healthCheck: false,
      getLatest: false,
      compare: false,
      listVersions: false,
      download: false,
      upload: false,
      delete: false
    };

    // 1. Health Check
    results.healthCheck = await this.testHealthCheck();

    if (!results.healthCheck) {
      console.log('❌ API no disponible. Abortando pruebas.');
      return results;
    }

    // 2. Listar versiones
    const versions = await this.testListVersions();
    results.listVersions = versions !== null;

    // 3. Obtener última versión
    const latestVersion = await this.testGetLatestVersion();
    results.getLatest = latestVersion !== null;

    // 4. Comparar versión
    if (latestVersion) {
      const compareResult = await this.testCompareVersion('1.0.0');
      results.compare = compareResult !== null;
    }

    // 5. Probar descarga (si hay versiones)
    if (versions && versions.length > 0) {
      results.download = await this.testDownload(versions[0].version);
    }

    // 6. Probar subida
    const uploadedVersion = await this.testUpload();
    results.upload = uploadedVersion !== null;

    // 7. Probar eliminación (de la versión que subimos)
    if (uploadedVersion) {
      results.delete = await this.testDelete('2.0.0-test');
    }

    // Resumen
    this.printSummary(results);
    return results;
  }

  printSummary(results) {
    console.log('\n' + '=' .repeat(50));
    console.log('📊 RESUMEN DE PRUEBAS');
    console.log('=' .repeat(50));

    const tests = [
      { name: 'Health Check', result: results.healthCheck },
      { name: 'Obtener última versión', result: results.getLatest },
      { name: 'Comparar versión', result: results.compare },
      { name: 'Listar versiones', result: results.listVersions },
      { name: 'Descargar APK', result: results.download },
      { name: 'Subir APK', result: results.upload },
      { name: 'Eliminar versión', result: results.delete }
    ];

    const passed = tests.filter(t => t.result).length;
    const total = tests.length;

    tests.forEach(test => {
      const icon = test.result ? '✅' : '❌';
      console.log(`${icon} ${test.name}`);
    });

    console.log('\n' + '-' .repeat(30));
    console.log(`📈 Resultados: ${passed}/${total} pruebas pasaron`);
    console.log(`🎯 Éxito: ${((passed/total) * 100).toFixed(1)}%`);

    if (passed === total) {
      console.log('\n🎉 ¡Todas las pruebas pasaron! API funcionando correctamente.');
    } else {
      console.log('\n⚠️  Algunas pruebas fallaron. Revisa la configuración.');
    }
  }
}

// Función para prueba específica
async function testSpecificEndpoint(endpoint) {
  const tester = new APITester(API_BASE_URL);
  
  switch(endpoint.toLowerCase()) {
    case 'health':
      await tester.testHealthCheck();
      break;
    case 'latest':
      await tester.testGetLatestVersion();
      break;
    case 'compare':
      await tester.testCompareVersion();
      break;
    case 'versions':
      await tester.testListVersions();
      break;
    case 'upload':
      await tester.testUpload();
      break;
    default:
      console.log('Endpoints disponibles: health, latest, compare, versions, upload');
  }
}

// Simulador de cliente MAUI
class MAUIClientSimulator {
  constructor(apiBaseUrl, currentVersion = '1.0.0') {
    this.apiBaseUrl = apiBaseUrl;
    this.currentVersion = currentVersion;
    this.client = axios.create({
      baseURL: apiBaseUrl,
      timeout: 10000
    });
  }

  async checkForUpdates() {
    console.log(`📱 Simulando cliente MAUI v${this.currentVersion}`);
    console.log('🔍 Verificando actualizaciones...');

    try {
      const response = await this.client.get(`/version/compare/${this.currentVersion}`);
      const updateInfo = response.data;

      if (updateInfo.success && updateInfo.hasUpdate) {
        console.log('🆕 ¡Actualización disponible!');
        console.log(`   Versión actual: ${updateInfo.currentVersion}`);
        console.log(`   Nueva versión: ${updateInfo.latestVersion}`);
        console.log(`   Tamaño: ${this.formatBytes(updateInfo.fileSize)}`);
        console.log(`   Notas: ${updateInfo.releaseNotes}`);
        
        // Simular descarga
        await this.simulateDownload(updateInfo.downloadUrl);
        
        return true;
      } else {
        console.log('✅ La aplicación está actualizada');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verificando actualizaciones:', error.message);
      return false;
    }
  }

  async simulateDownload(downloadUrl) {
    console.log('⬇️ Iniciando descarga en segundo plano...');
    
    try {
      const startTime = Date.now();
      const response = await this.client.get(downloadUrl, {
        responseType: 'stream'
      });

      let downloadedBytes = 0;
      const totalBytes = parseInt(response.headers['content-length'] || '0');

      // Simular progreso de descarga
      response.data.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const progress = totalBytes > 0 ? (downloadedBytes / totalBytes * 100).toFixed(1) : '0';
        process.stdout.write(`\r📥 Descargando... ${progress}% (${this.formatBytes(downloadedBytes)})`);
      });

      return new Promise((resolve, reject) => {
        response.data.on('end', () => {
          const duration = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`\n✅ Descarga completada en ${duration}s`);
          console.log('📦 Listo para instalar actualización');
          resolve(true);
        });

        response.data.on('error', (error) => {
          console.error('\n❌ Error en descarga:', error.message);
          reject(false);
        });

        // Cancelar descarga después de 5 segundos (para pruebas)
        setTimeout(() => {
          response.data.destroy();
          console.log('\n⏹️ Descarga cancelada (simulación)');
          resolve(true);
        }, 5000);
      });
    } catch (error) {
      console.error('❌ Error iniciando descarga:', error.message);
      return false;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Ejecución principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    if (args[0] === 'client') {
      // Simular cliente MAUI
      const currentVersion = args[1] || '1.0.0';
      const simulator = new MAUIClientSimulator(API_BASE_URL, currentVersion);
      await simulator.checkForUpdates();
    } else {
      // Probar endpoint específico
      await testSpecificEndpoint(args[0]);
    }
  } else {
    // Ejecutar todas las pruebas
    const tester = new APITester(API_BASE_URL);
    await tester.runAllTests();
  }
}

// Manejo de errores
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Error no manejado:', reason);
  process.exit(1);
});

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { APITester, MAUIClientSimulator };

/* 
EJEMPLOS DE USO:

# Ejecutar todas las pruebas
node test/api-test.js

# Probar endpoint específico
node test/api-test.js health
node test/api-test.js latest
node test/api-test.js upload

# Simular cliente MAUI
node test/api-test.js client 1.0.0
node test/api-test.js client 1.1.0
*/