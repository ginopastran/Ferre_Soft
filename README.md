This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Integración con AFIP

El sistema incluye integración con AFIP para la generación de facturas electrónicas. Para configurar la integración, sigue estos pasos:

### 1. Generar certificados

Ejecuta el script de generación de certificados:

```bash
node scripts/generate-afip-certs.js
```

Este script te guiará en el proceso de generación de certificados para el entorno de pruebas. Para producción, deberás generar certificados válidos a través del sitio de AFIP.

### 2. Configurar variables de entorno

Agrega las siguientes variables a tu archivo `.env`:

```
AFIP_CUIT=20000000000  # Reemplaza con tu CUIT
AFIP_CERT_PATH=./certs/cert.pem
AFIP_KEY_PATH=./certs/key.key
```

### 3. Aplicar migración para campos AFIP

Ejecuta el script de migración para agregar los campos necesarios a la base de datos:

```bash
node scripts/apply-afip-migration.js
```

### 4. Uso

Una vez configurado, el sistema generará automáticamente facturas electrónicas al crear facturas tipo A o B. La información de AFIP (CAE, vencimiento y número de comprobante) se mostrará en la vista de detalles de la factura.
