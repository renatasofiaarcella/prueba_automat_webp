const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ============================================================================
// FUNCIÓN PRINCIPAL DE OPTIMIZACIÓN DE IMAGEN
// ============================================================================
async function optimizarImagenParaS3(rutaImagenEntrada) {
  try {
    console.log('🔄 Procesando imagen...');

    // 1. Leer la imagen original desde el disco
    const bufferOriginal = fs.readFileSync(rutaImagenEntrada);
    const pesoOriginalKB = (bufferOriginal.length / 1024).toFixed(2);

    // 2. Primera pasada: Redimensionar (máx 1200px) y convertir a WebP al 80% de calidad
    let calidad = 80;
    let bufferOptimizado = await sharp(bufferOriginal)
      .resize({ 
        width: 1200, 
        withoutEnlargement: true // Si la foto mide menos de 1200px, no la agranda
      })
      .webp({ quality: calidad })
      .toBuffer();

    let pesoFinalKB = bufferOptimizado.length / 1024;

    // 3. Control de seguridad: Si supera los 200 KB, ajustar compresión automáticamente
    const LIMITE_KB = 200;
    if (pesoFinalKB > LIMITE_KB) {
      console.log(`⚠️ El archivo pesa ${pesoFinalKB.toFixed(2)} KB (supera los 200 KB). Re-comprimiendo...`);
      
      // Bajamos la calidad a 70% y el ancho máximo a 1000px
      calidad = 70;
      bufferOptimizado = await sharp(bufferOriginal)
        .resize({ width: 1000, withoutEnlargement: true })
        .webp({ quality: calidad })
        .toBuffer();

      pesoFinalKB = bufferOptimizado.length / 1024;
    }

    // 4. Guardar resultado localmente para inspeccionar la calidad visual
    const rutaSalida = path.join(__dirname, 'resultado_optimizada.webp');
    fs.writeFileSync(rutaSalida, bufferOptimizado);

    // ============================================================================
    // MOSTRAR RESULTADOS EMPÍRICOS EN CONSOLA
    // ============================================================================
    console.log('\n==================================================');
    console.log('🎉 ¡DEMOSTRACIÓN DE COMPRESIÓN EXITOSA!');
    console.log('==================================================');
    console.log(`📸 Imagen Original : ${pesoOriginalKB} KB`);
    console.log(`⚡ Imagen WebP     : ${pesoFinalKB.toFixed(2)} KB`);
    console.log(`📉 Reducción Total : ${(((pesoOriginalKB - pesoFinalKB) / pesoOriginalKB) * 100).toFixed(1)}% de ahorro`);
    console.log(`🎨 Calidad WebP    : ${calidad}%`);
    console.log(`📁 Guardada en     : ${rutaSalida}`);
    console.log('==================================================\n');

    return bufferOptimizado; // Este es el Buffer final listo para enviar a S3

  } catch (error) {
    console.error('❌ Error al procesar la imagen:', error.message);
  }
}

// ============================================================================
// EJECUCIÓN DE PRUEBA
// ============================================================================
// Reemplaza 'foto_original.jpg' por el nombre de una foto real de Mariana
const ARCHIVO_PRUEBA = path.join(__dirname, 'falda_encaje.jpg');

if (fs.existsSync(ARCHIVO_PRUEBA)) {
  optimizarImagenParaS3(ARCHIVO_PRUEBA);
} else {
  console.log(`⚠️ Por favor coloca una imagen llamada "foto_original.jpg" en la misma carpeta que este script para hacer la prueba.`);
}