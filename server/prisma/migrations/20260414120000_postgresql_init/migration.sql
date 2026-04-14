-- CreateTable
CREATE TABLE "ProcessingLog" (
    "id" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "extractedId" TEXT NOT NULL,
    "finalContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageBytes" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "originalName" TEXT,
    "sizeBytes" INTEGER NOT NULL,

    CONSTRAINT "ProcessingLog_pkey" PRIMARY KEY ("id")
);
