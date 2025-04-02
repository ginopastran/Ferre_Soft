#!/bin/bash
# Script para instalar dependencias mínimas de Chrome en Vercel

# Configurar variables de entorno para saltar la instalación de Chrome
echo "Configurando variables para Puppeteer y Chrome"
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Verificar si estamos en Vercel
if [ -n "$VERCEL" ]; then
  echo "Ejecutando en Vercel, configurando alternativas"
  # Crear archivo de configuración para que puppeteer use html-pdf-node como alternativa
  mkdir -p ./.config
  echo '{"chrome": {"useAlternative": true}}' > ./.config/chrome-config.json
fi

# Si falla la instalación de dependencias nativas, continuamos de todas formas
set +e
apt-get update && apt-get install -y libnss3 || true

echo "Configuración completada exitosamente"
exit 0 