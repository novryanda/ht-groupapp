import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type POWithRelations = any;

// POST - Catat pembayaran untuk PO
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { jumlahBayar, metodePembayaran, nomorReferensi, keterangan } = body;

    // Validate PO exists
    const po: POWithRelations = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        pembayaranPO: true,
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    if (!po) {
      return NextResponse.json(
        { error: "Purchase Order tidak ditemukan" },
        { status: 404 }
      );
    }

    // Calculate total already paid
    const totalDibayar = po.pembayaranPO.reduce((sum: number, p: { jumlahBayar: number }) => sum + p.jumlahBayar, 0);
    const sisa = po.totalAmount - totalDibayar;

    if (jumlahBayar > sisa) {
      return NextResponse.json(
        { error: `Jumlah pembayaran tidak boleh lebih dari sisa ${sisa}` },
        { status: 400 }
      );
    }

    // Create payment record
    const pembayaran = await db.pembayaranPO.create({
      data: {
        purchaseOrderId: id,
        jumlahBayar,
        metodePembayaran,
        nomorReferensi,
        keterangan,
        dibayarOleh: "Admin", // TODO: Get from session
      },
    });

    return NextResponse.json({
      success: true,
      pembayaran,
    });
  } catch (error) {
    console.error("Error creating pembayaran PO:", error);
    return NextResponse.json(
      { error: "Gagal mencatat pembayaran" },
      { status: 500 }
    );
  }
}
