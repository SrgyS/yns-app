-- CreateTable
CREATE TABLE "CourseTariff" (
    "id" TEXT NOT NULL,
    "access" "AccessType" NOT NULL,
    "price" INTEGER,
    "durationMonths" INTEGER,
    "feedback" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "CourseTariff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseTariff_courseId_idx" ON "CourseTariff"("courseId");

-- AddForeignKey
ALTER TABLE "CourseTariff" ADD CONSTRAINT "CourseTariff_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
