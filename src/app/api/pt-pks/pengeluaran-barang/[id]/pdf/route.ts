import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { generateInvoicePengeluaranBarangPDF } from "@/lib/pdf/pt-pks/generate-invoices";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pengeluaran = await db.pengeluaranBarang.findUnique({
      where: { id },
      include: {
        storeRequest: true,
        items: {
          include: {
            material: {
              include: {
                satuanMaterial: true,
                kategoriMaterial: true,
              },
            },
          },
        },
      },
    });

    if (!pengeluaran) {
      return NextResponse.json(
        { error: "Pengeluaran Barang tidak ditemukan" },
        { status: 404 }
      );
    }

    const pdfData = {
      id: pengeluaran.id,
      nomorPengeluaran: pengeluaran.nomorPengeluaran,
      tanggalPengeluaran: pengeluaran.tanggalPengeluaran.toISOString(),
      divisi: pengeluaran.divisi,
      requestedBy: pengeluaran.requestedBy,
      approvedBy: pengeluaran.approvedBy || undefined,
      tanggalApproval: pengeluaran.tanggalApproval?.toISOString(),
      issuedBy: pengeluaran.issuedBy || undefined,
      receivedByDivisi: pengeluaran.receivedByDivisi || undefined,
      tanggalDiterima: pengeluaran.tanggalDiterima?.toISOString(),
      status: pengeluaran.status,
      keterangan: pengeluaran.keterangan || undefined,
      storeRequest: pengeluaran.storeRequest
        ? {
            nomorSR: pengeluaran.storeRequest.nomorSR,
            tanggalRequest: pengeluaran.storeRequest.tanggalRequest.toISOString(),
          }
        : undefined,
      items: pengeluaran.items.map((item) => ({
        id: item.id,
        jumlahKeluar: item.jumlahKeluar,
        hargaSatuan: item.hargaSatuan,
        totalHarga: item.totalHarga,
        keterangan: item.keterangan || undefined,
        material: {
          namaMaterial: item.material.namaMaterial,
          partNumber: item.material.partNumber,
          kategoriMaterial: {
            nama: item.material.kategoriMaterial.name,
          },
          satuanMaterial: {
            symbol: item.material.satuanMaterial.symbol,
          },
        },
      })),
    };

    const pdfBuffer = await generateInvoicePengeluaranBarangPDF(pdfData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Pengeluaran-${pengeluaran.nomorPengeluaran}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating Pengeluaran Barang PDF:", error);
    return NextResponse.json(
      { error: "Gagal generate PDF" },
      { status: 500 }
    );
  }
}
