import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PRWithRelations = any;

// POST - Catat pembayaran untuk PR
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { jumlahBayar, metodePembayaran, nomorReferensi, keterangan } = body;

    // Validate PR exists
    const pr: PRWithRelations = await db.purchaseRequest.findUnique({
      where: { id },
      include: {
        items: true,
        pembayaranPR: true,
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    if (!pr) {
      return NextResponse.json(
        { error: "Purchase Request tidak ditemukan" },
        { status: 404 }
      );
    }

    // Calculate total nilai
    const totalNilai = pr.items.reduce((sum: number, item: { jumlahRequest: number; estimasiHarga: number | null }) => {
      return sum + (item.jumlahRequest * (item.estimasiHarga || 0));
    }, 0);

    // Calculate total already paid
    const totalDibayar = pr.pembayaranPR.reduce((sum: number, p: { jumlahBayar: number }) => sum + p.jumlahBayar, 0);
    const sisa = totalNilai - totalDibayar;

    if (jumlahBayar > sisa) {
      return NextResponse.json(
        { error: `Jumlah pembayaran tidak boleh lebih dari sisa ${sisa}` },
        { status: 400 }
      );
    }

    // Create payment record
    const pembayaran = await db.pembayaranPR.create({
      data: {
        purchaseRequestId: id,
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
    console.error("Error creating pembayaran PR:", error);
    return NextResponse.json(
      { error: "Gagal mencatat pembayaran" },
      { status: 500 }
    );
  }
}
