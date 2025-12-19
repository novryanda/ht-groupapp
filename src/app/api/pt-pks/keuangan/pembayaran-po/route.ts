import { NextResponse } from "next/server";
import { db } from "@/server/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type POWithRelations = any;

// GET - Daftar Purchase Order dengan pembayaran
export async function GET() {
  try {
    const purchaseOrders: POWithRelations[] = await db.purchaseOrder.findMany({
      where: {
        status: {
          in: ["ISSUED", "PARTIAL_RECEIVED", "COMPLETED"],
        },
      },
      include: {
        pembayaranPO: {
          orderBy: {
            tanggalBayar: "desc",
          },
        },
      },
      orderBy: {
        tanggalPO: "desc",
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const poList = purchaseOrders.map((po: POWithRelations) => ({
      id: po.id,
      nomorPO: po.nomorPO,
      tanggalPO: po.tanggalPO.toISOString(),
      vendorName: po.vendorName,
      vendorAddress: po.vendorAddress,
      issuedBy: po.issuedBy,
      approvedBy: po.approvedBy,
      totalAmount: po.totalAmount,
      status: po.status,
      termPembayaran: po.termPembayaran,
      keterangan: po.keterangan,
      pembayaranPO: po.pembayaranPO.map((p: { id: string; tanggalBayar: Date; jumlahBayar: number; metodePembayaran: string | null; nomorReferensi: string | null; keterangan: string | null; dibayarOleh: string; createdAt: Date }) => ({
        id: p.id,
        tanggalBayar: p.tanggalBayar.toISOString(),
        jumlahBayar: p.jumlahBayar,
        metodePembayaran: p.metodePembayaran,
        nomorReferensi: p.nomorReferensi,
        keterangan: p.keterangan,
        dibayarOleh: p.dibayarOleh,
        createdAt: p.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json(poList);
  } catch (error) {
    console.error("Error fetching PO:", error);
    return NextResponse.json(
      { error: "Gagal memuat data PO" },
      { status: 500 }
    );
  }
}
