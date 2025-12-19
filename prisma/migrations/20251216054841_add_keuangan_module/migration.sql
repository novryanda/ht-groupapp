-- CreateEnum
CREATE TYPE "StatusPembayaran" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "TipeTransaksiKeuangan" AS ENUM ('PENERIMAAN_TBS', 'PURCHASE_ORDER', 'PEMBELIAN_LANGSUNG', 'PENGIRIMAN_PRODUCT');

-- CreateTable
CREATE TABLE "Hutang" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipeTransaksi" "TipeTransaksiKeuangan" NOT NULL,
    "referensiId" TEXT NOT NULL,
    "referensiNomor" TEXT NOT NULL,
    "tanggalTransaksi" TIMESTAMP(3) NOT NULL,
    "tanggalJatuhTempo" TIMESTAMP(3),
    "pihakKetigaId" TEXT,
    "pihakKetigaNama" TEXT NOT NULL,
    "pihakKetigaTipe" TEXT,
    "totalNilai" DOUBLE PRECISION NOT NULL,
    "totalDibayar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sisaHutang" DOUBLE PRECISION NOT NULL,
    "status" "StatusPembayaran" NOT NULL DEFAULT 'UNPAID',
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hutang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PembayaranHutang" (
    "id" TEXT NOT NULL,
    "hutangId" TEXT NOT NULL,
    "tanggalBayar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jumlahBayar" DOUBLE PRECISION NOT NULL,
    "metodePembayaran" TEXT,
    "nomorReferensi" TEXT,
    "keterangan" TEXT,
    "dibayarOleh" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PembayaranHutang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Piutang" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipeTransaksi" "TipeTransaksiKeuangan" NOT NULL DEFAULT 'PENGIRIMAN_PRODUCT',
    "referensiId" TEXT NOT NULL,
    "referensiNomor" TEXT NOT NULL,
    "tanggalTransaksi" TIMESTAMP(3) NOT NULL,
    "tanggalJatuhTempo" TIMESTAMP(3),
    "buyerId" TEXT,
    "buyerNama" TEXT NOT NULL,
    "contractId" TEXT,
    "contractNumber" TEXT,
    "totalNilai" DOUBLE PRECISION NOT NULL,
    "totalDiterima" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sisaPiutang" DOUBLE PRECISION NOT NULL,
    "status" "StatusPembayaran" NOT NULL DEFAULT 'UNPAID',
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Piutang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PenerimaanPiutang" (
    "id" TEXT NOT NULL,
    "piutangId" TEXT NOT NULL,
    "tanggalTerima" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jumlahTerima" DOUBLE PRECISION NOT NULL,
    "metodePembayaran" TEXT,
    "nomorReferensi" TEXT,
    "keterangan" TEXT,
    "diterimaOleh" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PenerimaanPiutang_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Hutang_companyId_idx" ON "Hutang"("companyId");

-- CreateIndex
CREATE INDEX "Hutang_tipeTransaksi_idx" ON "Hutang"("tipeTransaksi");

-- CreateIndex
CREATE INDEX "Hutang_status_idx" ON "Hutang"("status");

-- CreateIndex
CREATE INDEX "Hutang_tanggalTransaksi_idx" ON "Hutang"("tanggalTransaksi");

-- CreateIndex
CREATE INDEX "Hutang_pihakKetigaId_idx" ON "Hutang"("pihakKetigaId");

-- CreateIndex
CREATE INDEX "PembayaranHutang_hutangId_idx" ON "PembayaranHutang"("hutangId");

-- CreateIndex
CREATE INDEX "PembayaranHutang_tanggalBayar_idx" ON "PembayaranHutang"("tanggalBayar");

-- CreateIndex
CREATE INDEX "Piutang_companyId_idx" ON "Piutang"("companyId");

-- CreateIndex
CREATE INDEX "Piutang_status_idx" ON "Piutang"("status");

-- CreateIndex
CREATE INDEX "Piutang_tanggalTransaksi_idx" ON "Piutang"("tanggalTransaksi");

-- CreateIndex
CREATE INDEX "Piutang_buyerId_idx" ON "Piutang"("buyerId");

-- CreateIndex
CREATE INDEX "Piutang_contractId_idx" ON "Piutang"("contractId");

-- CreateIndex
CREATE INDEX "PenerimaanPiutang_piutangId_idx" ON "PenerimaanPiutang"("piutangId");

-- CreateIndex
CREATE INDEX "PenerimaanPiutang_tanggalTerima_idx" ON "PenerimaanPiutang"("tanggalTerima");

-- AddForeignKey
ALTER TABLE "PembayaranHutang" ADD CONSTRAINT "PembayaranHutang_hutangId_fkey" FOREIGN KEY ("hutangId") REFERENCES "Hutang"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenerimaanPiutang" ADD CONSTRAINT "PenerimaanPiutang_piutangId_fkey" FOREIGN KEY ("piutangId") REFERENCES "Piutang"("id") ON DELETE CASCADE ON UPDATE CASCADE;
