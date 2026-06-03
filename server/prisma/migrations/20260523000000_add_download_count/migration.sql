-- AlterTable: add downloadCount with default 0 to ActivityQr
ALTER TABLE "ActivityQr" ADD COLUMN IF NOT EXISTS "downloadCount" INTEGER NOT NULL DEFAULT 0;
