-- Add SUPERADMIN role if it doesn't exist
INSERT INTO "Rol" (nombre)
SELECT 'SUPERADMIN'
WHERE NOT EXISTS (SELECT 1 FROM "Rol" WHERE nombre = 'SUPERADMIN'); 