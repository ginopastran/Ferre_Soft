-- Primero agregamos la columna permitiendo NULL temporalmente
ALTER TABLE "DetalleOrden" ADD COLUMN "costo" DOUBLE PRECISION;

-- Actualizamos los registros existentes
UPDATE "DetalleOrden" d
SET "costo" = p.costo
FROM "Producto" p
WHERE d."productoId" = p.id;

-- Hacemos la columna NOT NULL
ALTER TABLE "DetalleOrden" ALTER COLUMN "costo" SET NOT NULL; 