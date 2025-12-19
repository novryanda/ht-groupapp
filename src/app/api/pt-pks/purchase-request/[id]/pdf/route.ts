import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { generateInvoicePRPDF } from "@/lib/pdf/pt-pks/generate-invoices";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const purchaseRequest = await db.purchaseRequest.findUnique({
      where: { id },
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
      },
    });

    if (!purchaseRequest) {
      return NextResponse.json(
        { error: "Purchase Request tidak ditemukan" },
        { status: 404 }
      );
    }

    const pdfData = {
      id: purchaseRequest.id,
      nomorPR: purchaseRequest.nomorPR,
      tanggalRequest: purchaseRequest.tanggalRequest.toISOString(),
      tipePembelian: purchaseRequest.tipePembelian,
      divisi: purchaseRequest.divisi || undefined,
      requestedBy: purchaseRequest.requestedBy,
      approvedBy: purchaseRequest.approvedBy || undefined,
      tanggalApproval: purchaseRequest.tanggalApproval?.toISOString(),
      vendorNameDirect: purchaseRequest.vendorNameDirect || undefined,
      vendorAddressDirect: purchaseRequest.vendorAddressDirect || undefined,
      vendorPhoneDirect: purchaseRequest.vendorPhoneDirect || undefined,
      status: purchaseRequest.status,
      keterangan: purchaseRequest.keterangan || undefined,
      items: purchaseRequest.items.map((item) => ({
        id: item.id,
        jumlahRequest: item.jumlahRequest,
        estimasiHarga: item.estimasiHarga ?? 0,
        keterangan: item.keterangan || undefined,
        material: {
          partNumber: item.material.partNumber,
          namaMaterial: item.material.namaMaterial,
          satuanMaterial: {
            symbol: item.material.satuanMaterial.symbol,
          },
        },
      })),
    };

    const pdfBuffer = await generateInvoicePRPDF(pdfData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="PR-${purchaseRequest.nomorPR}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PR PDF:", error);
    return NextResponse.json(
      { error: "Gagal generate PDF" },
      { status: 500 }
    );
  }
}
