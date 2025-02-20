/*
  Warnings:

  - Added the required column `metodoPago` to the `OrdenCompra` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrdenCompra" ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "metodoPago" TEXT NOT NULL;
