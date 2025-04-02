#!/bin/bash
# Script para configurar el entorno en Vercel sin comandos apt-get

# Configurar variables de entorno para que puppeteer use alternativas
echo "Configurando variables para Puppeteer"
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/tmp/chromium-binary

# Crear directorio para configuración
echo "Creando archivos de configuración..."
mkdir -p ./.config
echo '{"pdf": {"useHtmlPdfNode": true}}' > ./.config/app-config.json

# Crear archivo flag para indicar que estamos en Vercel
touch ./.vercel-deployment

echo "Configuración completada exitosamente"
exit 0 