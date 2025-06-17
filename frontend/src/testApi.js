// Script para probar la conexión con la API
// Ejecutar en la consola del navegador

// Función para probar la API
const testApi = async () => {
  console.log('Probando conexión con la API...');
  
  try {
    // Probar conexión básica
    console.log('1. Probando conexión básica...');
    const response = await fetch('http://localhost:8000/api/productos/', {
      method: 'HEAD',
      cache: 'no-cache'
    });
    
    console.log('Respuesta:', response.status, response.ok);
    
    if (!response.ok) {
      console.error('Error: La API no está respondiendo correctamente');
      return false;
    }
    
    // Probar obtener productos
    console.log('2. Probando obtener productos...');
    const productsResponse = await fetch('http://localhost:8000/api/productos/');
    const products = await productsResponse.json();
    
    console.log(`Productos obtenidos: ${products.length}`);
    
    // Probar CORS
    console.log('3. Probando CORS...');
    const corsResponse = await fetch('http://localhost:8000/api/productos/', {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('CORS respuesta:', corsResponse.status, corsResponse.ok);
    
    console.log('Pruebas completadas con éxito');
    return true;
  } catch (error) {
    console.error('Error al probar la API:', error);
    return false;
  }
};

// Ejecutar la prueba
testApi().then(success => {
  if (success) {
    console.log('✅ La API está funcionando correctamente');
  } else {
    console.log('❌ Hay problemas con la API');
  }
});