-- CreateTable
CREATE TABLE "PembayaranPR" (
    "id" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "tanggalBayar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jumlahBayar" DOUBLE PRECISION NOT NULL,
    "metodePembayaran" TEXT,
    "nomorReferensi" TEXT,
    "keterangan" TEXT,
    "dibayarOleh" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PembayaranPR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PembayaranPO" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "tanggalBayar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jumlahBayar" DOUBLE PRECISION NOT NULL,
    "metodePembayaran" TEXT,
    "nomorReferensi" TEXT,
    "keterangan" TEXT,
    "dibayarOleh" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PembayaranPO_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PembayaranPR_purchaseRequestId_idx" ON "PembayaranPR"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "PembayaranPR_tanggalBayar_idx" ON "PembayaranPR"("tanggalBayar");

-- CreateIndex
CREATE INDEX "PembayaranPO_purchaseOrderId_idx" ON "PembayaranPO"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PembayaranPO_tanggalBayar_idx" ON "PembayaranPO"("tanggalBayar");

-- AddForeignKey
ALTER TABLE "PembayaranPR" ADD CONSTRAINT "PembayaranPR_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PembayaranPO" ADD CONSTRAINT "PembayaranPO_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
