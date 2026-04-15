-- AlterTable
ALTER TABLE "ActivityQr" ADD COLUMN     "school" TEXT NOT NULL DEFAULT '其他',
ADD COLUMN     "signInAt" TIMESTAMP(3);
