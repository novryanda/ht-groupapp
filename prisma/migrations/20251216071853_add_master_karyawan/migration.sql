-- AlterTable
ALTER TABLE "PenggajianKaryawan" ADD COLUMN     "masterKaryawanId" TEXT;

-- CreateTable
CREATE TABLE "MasterKaryawan" (
    "id" TEXT NOT NULL,
    "namaKaryawan" TEXT NOT NULL,
    "tktk" TEXT,
    "gol" TEXT,
    "nomorRekening" TEXT,
    "devisi" TEXT,
    "noBpjsTk" TEXT,
    "noBpjsKesehatan" TEXT,
    "jabatan" TEXT,
    "gajiPokok" DECIMAL(15,0) NOT NULL DEFAULT 0,
    "tunjanganJabatan" DECIMAL(15,0) NOT NULL DEFAULT 0,
    "tunjanganPerumahan" DECIMAL(15,0) NOT NULL DEFAULT 0,
    "pctBpjsTkJht" DECIMAL(5,2) NOT NULL DEFAULT 2,
    "pctBpjsTkJn" DECIMAL(5,2) NOT NULL DEFAULT 1,
    "pctBpjsKesehatan" DECIMAL(5,2) NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tanggalMulaiKerja" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterKaryawan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MasterKaryawan_namaKaryawan_idx" ON "MasterKaryawan"("namaKaryawan");

-- CreateIndex
CREATE INDEX "MasterKaryawan_devisi_idx" ON "MasterKaryawan"("devisi");

-- CreateIndex
CREATE INDEX "MasterKaryawan_isActive_idx" ON "MasterKaryawan"("isActive");

-- CreateIndex
CREATE INDEX "PenggajianKaryawan_masterKaryawanId_idx" ON "PenggajianKaryawan"("masterKaryawanId");

-- AddForeignKey
ALTER TABLE "PenggajianKaryawan" ADD CONSTRAINT "PenggajianKaryawan_masterKaryawanId_fkey" FOREIGN KEY ("masterKaryawanId") REFERENCES "MasterKaryawan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
