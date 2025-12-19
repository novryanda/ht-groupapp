import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { generateInvoicePenerimaanBarangPDF } from "@/lib/pdf/pt-pks/generate-invoices";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const penerimaan = await db.penerimaanBarang.findUnique({
      where: { id },
      include: {
        purchaseOrder: true,
        items: {
          include: {
            material: {
              include: {
                satuanMaterial: true,
              },
            },
            purchaseOrderItem: true,
          },
        },
      },
    });

    if (!penerimaan) {
      return NextResponse.json(
        { error: "Penerimaan Barang tidak ditemukan" },
        { status: 404 }
      );
    }

    const pdfData = {
      id: penerimaan.id,
      nomorPenerimaan: penerimaan.nomorPenerimaan,
      tanggalPenerimaan: penerimaan.tanggalPenerimaan.toISOString(),
      receivedBy: penerimaan.receivedBy,
      checkedBy: penerimaan.checkedBy || undefined,
      status: penerimaan.status,
      keterangan: penerimaan.keterangan || undefined,
      vendorName: penerimaan.vendorName || undefined,
      purchaseOrder: penerimaan.purchaseOrder
        ? {
            id: penerimaan.purchaseOrder.id,
            nomorPO: penerimaan.purchaseOrder.nomorPO,
            tanggalPO: penerimaan.purchaseOrder.tanggalPO.toISOString(),
            vendorName: penerimaan.purchaseOrder.vendorName,
            totalAmount: penerimaan.purchaseOrder.totalAmount,
          }
        : undefined,
      items: penerimaan.items.map((item) => ({
        id: item.id,
        jumlahOrder: item.purchaseOrderItem?.jumlahOrder,
        jumlahDiterima: item.jumlahDiterima,
        hargaSatuan: item.hargaSatuan,
        totalHarga: item.totalHarga,
        lokasiPenyimpanan: item.lokasiPenyimpanan || undefined,
        keterangan: item.keterangan || undefined,
        material: {
          id: item.material.id,
          partNumber: item.material.partNumber,
          namaMaterial: item.material.namaMaterial,
          satuanMaterial: {
            symbol: item.material.satuanMaterial.symbol,
          },
        },
      })),
    };

    const pdfBuffer = await generateInvoicePenerimaanBarangPDF(pdfData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Penerimaan-${penerimaan.nomorPenerimaan}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating Penerimaan Barang PDF:", error);
    return NextResponse.json(
      { error: "Gagal generate PDF" },
      { status: 500 }
    );
  }
}
