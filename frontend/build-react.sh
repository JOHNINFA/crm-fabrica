#!/bin/bash

#🔧 Script para construir sin minimizar CSS (evita problemas con SVG data URLs)

echo "🏗️ Construyendo React (sin minimización CSS)..."

# Variables de entorno para deshabilitar optimizaciones problemáticas
export GENERATE_SOURCEMAP=false
export DISABLE_ESLINT_PLUGIN=true
export IMAGE_INLINE_SIZE_LIMIT=0

# Instalar craco si no existe
if [ ! -d "node_modules/@craco/craco" ]; then
    echo "📦 Instalando CRACO..."
    npm install --save-dev @craco/craco
fi

# Crear configuración temporal de craco
cat > craco.config.temp.js << 'EOF'
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Reemplazar el CSS Minimizer con configuración más permisiva
      webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.map((plugin) => {
        if (plugin.constructor.name === 'CssMinimizerPlugin') {
          return new CssMinimizerPlugin({
            minimizerOptions: {
              preset: [
                'default',
                {
                  discardComments: { removeAll: true },
                  // NO optimizar SVG data URLs
                  svgo: false,
                }
              ],
            },
          });
        }
        return plugin;
      });
      
      return webpackConfig;
    },
  },
};
EOF

# Usar craco en lugar de react-scripts
npx craco build --config craco.config.temp.js

# Limpiar
rm -f craco.config.temp.js

echo "✅ Build completado"
