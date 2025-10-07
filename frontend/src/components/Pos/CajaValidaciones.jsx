// CajaValidaciones.jsx - Validaciones avanzadas para el módulo de caja

export const cajaValidaciones = {
    /**
     * Validar valores de caja
     */
    validarValoresCaja: (valoresCaja, valoresSistema) => {
        const errores = [];
        const advertencias = [];

        // Validar que no haya valores negativos
        Object.entries(valoresCaja).forEach(([metodo, valor]) => {
            if (valor < 0) {
                errores.push(`El valor de ${metodo} no puede ser negativo`);
            }
        });

        // Validar diferencias excesivas
        Object.entries(valoresCaja).forEach(([metodo, valorCaja]) => {
            const valorSistema = valoresSistema[metodo] || 0;
            const diferencia = Math.abs(valorCaja - valorSistema);
            const porcentajeDiferencia = valorSistema > 0 ? (diferencia / valorSistema) * 100 : 0;

            if (porcentajeDiferencia > 10 && diferencia > 50000) {
                advertencias.push(`Diferencia significativa en ${metodo}: ${porcentajeDiferencia.toFixed(1)}%`);
            }
        });

        // Validar efectivo (no puede ser mayor al 200% del sistema)
        const efectivoCaja = valoresCaja.efectivo || 0;
        const efectivoSistema = valoresSistema.efectivo || 0;
        if (efectivoCaja > efectivoSistema * 2 && efectivoSistema > 0) {
            advertencias.push('El efectivo en caja parece excesivo comparado con las ventas');
        }

        return { errores, advertencias, esValido: errores.length === 0 };
    },

    /**
     * Validar antes de guardar arqueo
     */
    validarAntesDeGuardar: (datosArqueo) => {
        const errores = [];

        // Validar datos requeridos
        if (!datosArqueo.cajero) {
            errores.push('Debe seleccionar un cajero');
        }

        if (!datosArqueo.fecha) {
            errores.push('La fecha es requerida');
        }

        // Validar que al menos un método tenga valor
        const tieneValores = Object.values(datosArqueo.valoresCaja).some(valor => valor > 0);
        if (!tieneValores) {
            errores.push('Debe ingresar al menos un valor en caja');
        }

        // Validar diferencia total excesiva
        const diferenciaTotalAbs = Math.abs(datosArqueo.totalDiferencia);
        if (diferenciaTotalAbs > 100000) {
            errores.push('La diferencia total es muy alta, verifique los valores');
        }

        return { errores, esValido: errores.length === 0 };
    },

    /**
     * Validar formato de números
     */
    validarFormatoNumero: (valor) => {
        const numero = parseFloat(valor.toString().replace(/[^\d.-]/g, ''));

        if (isNaN(numero)) {
            return { esValido: false, error: 'Formato de número inválido' };
        }

        if (numero < 0) {
            return { esValido: false, error: 'El valor no puede ser negativo' };
        }

        if (numero > 999999999) {
            return { esValido: false, error: 'El valor es demasiado grande' };
        }

        return { esValido: true, valor: numero };
    },

    /**
     * Validar horario de arqueo
     */
    validarHorarioArqueo: () => {
        const ahora = new Date();
        const hora = ahora.getHours();

        // Advertir si es muy temprano o muy tarde
        if (hora < 6 || hora > 23) {
            return {
                esValido: true,
                advertencia: 'Está realizando el arqueo fuera del horario habitual (6:00 - 23:00)'
            };
        }

        return { esValido: true };
    },

    /**
     * Validar consistencia con arqueos anteriores
     */
    validarConsistenciaHistorica: (arqueoActual, arqueoAnterior) => {
        if (!arqueoAnterior) return { esValido: true };

        const advertencias = [];

        // Comparar con arqueo anterior
        const diferenciaDias = Math.abs(arqueoActual.totalCaja - arqueoAnterior.totalCaja);
        const porcentajeCambio = arqueoAnterior.totalCaja > 0 ?
            (diferenciaDias / arqueoAnterior.totalCaja) * 100 : 0;

        if (porcentajeCambio > 50) {
            advertencias.push(`Cambio significativo respecto al arqueo anterior: ${porcentajeCambio.toFixed(1)}%`);
        }

        return { esValido: true, advertencias };
    },

    /**
     * Generar recomendaciones
     */
    generarRecomendaciones: (valoresCaja, valoresSistema, diferencias) => {
        const recomendaciones = [];

        // Recomendaciones por diferencias
        Object.entries(diferencias).forEach(([metodo, diferencia]) => {
            if (diferencia < -10000) {
                recomendaciones.push({
                    tipo: 'error',
                    metodo,
                    mensaje: `Faltante en ${metodo}: Verifique conteo y transacciones`
                });
            } else if (diferencia > 10000) {
                recomendaciones.push({
                    tipo: 'warning',
                    metodo,
                    mensaje: `Sobrante en ${metodo}: Verifique si hay ingresos no registrados`
                });
            }
        });

        // Recomendación de efectivo alto
        if (valoresCaja.efectivo > 2000000) {
            recomendaciones.push({
                tipo: 'info',
                metodo: 'efectivo',
                mensaje: 'Considere realizar consignación por seguridad'
            });
        }

        // Recomendación de arqueo perfecto (sospechoso)
        const todasLasDiferencias = Object.values(diferencias);
        const diferenciasCero = todasLasDiferencias.filter(d => d === 0).length;

        if (diferenciasCero === todasLasDiferencias.length && valoresCaja.efectivo > 0) {
            recomendaciones.push({
                tipo: 'warning',
                metodo: 'general',
                mensaje: 'Arqueo perfecto: Verifique que el conteo sea preciso'
            });
        }

        return recomendaciones;
    }
};

// Componente de alertas de validación
export const AlertasValidacion = ({ validacion, onClose }) => {
    if (!validacion || (validacion.errores?.length === 0 && validacion.advertencias?.length === 0)) {
        return null;
    }

    return (
        <div className="validacion-alerts mb-3">
            {/* Errores */}
            {validacion.errores?.map((error, index) => (
                <div key={`error-${index}`} className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Error:</strong> {error}
                    <button type="button" className="btn-close" onClick={onClose}></button>
                </div>
            ))}

            {/* Advertencias */}
            {validacion.advertencias?.map((advertencia, index) => (
                <div key={`warning-${index}`} className="alert alert-warning alert-dismissible fade show" role="alert">
                    <i className="bi bi-exclamation-circle-fill me-2"></i>
                    <strong>Advertencia:</strong> {advertencia}
                    <button type="button" className="btn-close" onClick={onClose}></button>
                </div>
            ))}
        </div>
    );
};

// Componente de recomendaciones
export const RecomendacionesCaja = ({ recomendaciones }) => {
    if (!recomendaciones || recomendaciones.length === 0) {
        return null;
    }

    const getIconForTipo = (tipo) => {
        switch (tipo) {
            case 'error': return 'bi-x-circle-fill';
            case 'warning': return 'bi-exclamation-triangle-fill';
            case 'info': return 'bi-info-circle-fill';
            default: return 'bi-lightbulb-fill';
        }
    };

    const getClassForTipo = (tipo) => {
        switch (tipo) {
            case 'error': return 'alert-danger';
            case 'warning': return 'alert-warning';
            case 'info': return 'alert-info';
            default: return 'alert-secondary';
        }
    };

    return (
        <div className="recomendaciones-caja mt-3">
            <h6><i className="bi bi-lightbulb me-2"></i>Recomendaciones</h6>
            {recomendaciones.map((rec, index) => (
                <div key={index} className={`alert ${getClassForTipo(rec.tipo)} py-2`} role="alert">
                    <i className={`bi ${getIconForTipo(rec.tipo)} me-2`}></i>
                    <small><strong>{rec.metodo}:</strong> {rec.mensaje}</small>
                </div>
            ))}
        </div>
    );
};

export default cajaValidaciones;