-- AlterTable
ALTER TABLE "PenggajianKaryawan" ADD COLUMN     "lemburDetail" JSONB,
ADD COLUMN     "totalMenit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalMenitDibayar" INTEGER NOT NULL DEFAULT 0;
