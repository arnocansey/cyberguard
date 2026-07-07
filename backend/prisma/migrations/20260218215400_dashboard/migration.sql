-- CreateTable
CREATE TABLE "DashboardLayout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleScope" "UserRole",
    "teamScope" TEXT,
    "panelsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardLayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DashboardLayout_userId_createdAt_idx" ON "DashboardLayout"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DashboardLayout_roleScope_createdAt_idx" ON "DashboardLayout"("roleScope", "createdAt");

-- CreateIndex
CREATE INDEX "DashboardLayout_teamScope_createdAt_idx" ON "DashboardLayout"("teamScope", "createdAt");

-- AddForeignKey
ALTER TABLE "DashboardLayout" ADD CONSTRAINT "DashboardLayout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
