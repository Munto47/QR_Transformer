-- CreateTable
CREATE TABLE "ProcessingLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rawContent" TEXT NOT NULL,
    "extractedId" TEXT NOT NULL,
    "finalContent" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
