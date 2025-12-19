import { NextResponse } from "next/server";
import { db } from "@/server/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PRWithRelations = any;

// GET - Daftar PR Pembelian Langsung dengan pembayaran
export async function GET() {
  try {
    const purchaseRequests: PRWithRelations[] = await db.purchaseRequest.findMany({
      where: {
        tipePembelian: "PEMBELIAN_LANGSUNG",
        status: {
          in: ["APPROVED", "COMPLETED"],
        },
      },
      include: {
        items: {
          include: {
            material: {
              include: {
                satuanMaterial: true,
              },
            },
          },
        },
        pembayaranPR: {
          orderBy: {
            tanggalBayar: "desc",
          },
        },
      },
      orderBy: {
        tanggalRequest: "desc",
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Calculate total nilai for each PR
    const prWithTotal = purchaseRequests.map((pr: PRWithRelations) => {
      const totalNilai = pr.items.reduce((sum: number, item: { jumlahRequest: number; estimasiHarga: number | null }) => {
        return sum + (item.jumlahRequest * (item.estimasiHarga || 0));
      }, 0);

      return {
        id: pr.id,
        nomorPR: pr.nomorPR,
        tanggalRequest: pr.tanggalRequest.toISOString(),
        vendorName: pr.vendorNameDirect,
        requestedBy: pr.requestedBy,
        approvedBy: pr.approvedBy,
        totalNilai,
        status: pr.status,
        purchaseType: pr.tipePembelian,
        divisi: pr.divisi,
        keterangan: pr.keterangan,
        pembayaranPR: pr.pembayaranPR.map((p: { id: string; tanggalBayar: Date; jumlahBayar: number; metodePembayaran: string | null; nomorReferensi: string | null; keterangan: string | null; dibayarOleh: string; createdAt: Date }) => ({
          id: p.id,
          tanggalBayar: p.tanggalBayar.toISOString(),
          jumlahBayar: p.jumlahBayar,
          metodePembayaran: p.metodePembayaran,
          nomorReferensi: p.nomorReferensi,
          keterangan: p.keterangan,
          dibayarOleh: p.dibayarOleh,
          createdAt: p.createdAt.toISOString(),
        })),
      };
    });

    return NextResponse.json(prWithTotal);
  } catch (error) {
    console.error("Error fetching PR:", error);
    return NextResponse.json(
      { error: "Gagal memuat data PR" },
      { status: 500 }
    );
  }
}
