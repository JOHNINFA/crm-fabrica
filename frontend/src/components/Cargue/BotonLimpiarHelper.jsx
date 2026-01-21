// 📥 HELPER: Cargar datos de cargue unificados (LocalStorage o BD) para un ID específico
const cargarDatosCargue = async (fechaAUsar, vendedorId) => {
    const { simpleStorage } = await import('../../services/simpleStorage');

    // Formatear fecha
    let fechaFormateada;
    if (fechaAUsar instanceof Date) {
        fechaFormateada = fechaAUsar.toISOString().split('T')[0];
    } else {
        fechaFormateada = String(fechaAUsar).split('T')[0];
    }

    const key = `cargue_${dia}_${vendedorId}_${fechaFormateada}`;
    let datosCargue = await simpleStorage.getItem(key);

    console.log(`🔍 ${vendedorId} - Helper Cargue: Buscando en ${key}... Found: ${datosCargue ? 'YES' : 'NO'}`);

    // Si no está en LocalStorage, intentar BD
    if (!datosCargue || !datosCargue.productos || datosCargue.productos.length === 0) {
        try {
            const endpoint = vendedorId === 'ID1' ? 'cargue-id1' :
                vendedorId === 'ID2' ? 'cargue-id2' :
                    vendedorId === 'ID3' ? 'cargue-id3' :
                        vendedorId === 'ID4' ? 'cargue-id4' :
                            vendedorId === 'ID5' ? 'cargue-id5' : 'cargue-id6';

            const url = `/api/${endpoint}/?fecha=${fechaFormateada}&dia=${dia.toUpperCase()}`;
            const response = await fetch(url);
            const datosDB = await response.json();

            if (Array.isArray(datosDB) && datosDB.length > 0) {
                datosCargue = {
                    productos: datosDB.map(p => ({
                        id: p.producto_id || p.id,
                        producto: p.producto,
                        cantidad: p.cantidad || 0,
                        adicional: p.adicional || 0,
                        total: p.total || 0,
                        vencidas: p.vencidas || 0,
                        devoluciones: p.devoluciones || 0,
                        vendedor: p.v || p.vendedor || false,
                        despachador: p.d || p.despachador || false
                    }))
                };
            }
        } catch (e) {
            console.error(`❌ ${vendedorId} - Error Helper DB:`, e);
        }
    }

    // Si aun no hay datos
    if (!datosCargue || !datosCargue.productos) return null;

    // Calcular productosACargue (mapeo IDs reales)
    const productosACargue = [];

    // Necesitamos mapa de productos para IDs reales (se asume cargado o se pide rapido)
    // Para simplificar y no hacer fetch 6 veces, hacemos fetch aqui si es necesario, 
    // pero idealmente deberia pasarse como argumento. Por robustez lo pedimos si no hay cache.
    // Usaremos una variable global o llamada local ya que fetch es rapido en localhost
    try {
        const prodRes = await fetch('/api/productos/');
        const todosProds = await prodRes.json();

        for (const p of datosCargue.productos) {
            if (p.vendedor && p.despachador && p.total > 0) {
                const pReal = todosProds.find(tp => tp.nombre.toUpperCase() === p.producto.toUpperCase());
                if (pReal) {
                    productosACargue.push({
                        id: pReal.id,
                        nombre: p.producto,
                        cantidad: p.total
                    });
                }
            }
        }
    } catch (e) {
        console.error("Error mapeando productos en helper:", e);
    }

    datosCargue.productosACargue = productosACargue;
    return datosCargue;
};

