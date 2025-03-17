-- Add SUPERADMIN role if it doesn't exist
INSERT INTO "Rol" (nombre)
SELECT 'SUPERADMIN'
WHERE NOT EXISTS (SELECT 1 FROM "Rol" WHERE nombre = 'SUPERADMIN');

-- Instructions for assigning a SUPERADMIN role to an existing user:
-- Replace USER_ID with the actual user ID you want to set as SUPERADMIN
/*
UPDATE "Usuario"
SET "rolId" = (SELECT id FROM "Rol" WHERE nombre = 'SUPERADMIN')
WHERE id = USER_ID;
*/ 