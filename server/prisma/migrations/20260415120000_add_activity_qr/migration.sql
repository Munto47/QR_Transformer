-- CreateTable
CREATE TABLE "ActivityQr" (
    "id" TEXT NOT NULL,
    "activityName" TEXT NOT NULL,
    "activityAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageBytes" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "originalName" TEXT,
    "sizeBytes" INTEGER NOT NULL,

    CONSTRAINT "ActivityQr_pkey" PRIMARY KEY ("id")
);
