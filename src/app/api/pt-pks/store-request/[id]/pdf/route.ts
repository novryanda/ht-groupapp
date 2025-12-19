import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { generateInvoiceSRPDF } from "@/lib/pdf/pt-pks/generate-invoices";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const storeRequest = await db.storeRequest.findUnique({
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

    if (!storeRequest) {
      return NextResponse.json(
        { error: "Store Request tidak ditemukan" },
        { status: 404 }
      );
    }

    const pdfData = {
      id: storeRequest.id,
      nomorSR: storeRequest.nomorSR,
      tanggalRequest: storeRequest.tanggalRequest.toISOString(),
      divisi: storeRequest.divisi,
      requestedBy: storeRequest.requestedBy,
      approvedBy: storeRequest.approvedBy || undefined,
      tanggalApproval: storeRequest.tanggalApproval?.toISOString(),
      status: storeRequest.status,
      keterangan: storeRequest.keterangan || undefined,
      items: storeRequest.items.map((item) => ({
        id: item.id,
        jumlahRequest: item.jumlahRequest,
        keterangan: item.keterangan || undefined,
        material: {
          partNumber: item.material.partNumber,
          namaMaterial: item.material.namaMaterial,
          stockOnHand: item.material.stockOnHand,
          satuanMaterial: {
            symbol: item.material.satuanMaterial.symbol,
          },
        },
      })),
    };

    const pdfBuffer = await generateInvoiceSRPDF(pdfData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="SR-${storeRequest.nomorSR}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating SR PDF:", error);
    return NextResponse.json(
      { error: "Gagal generate PDF" },
      { status: 500 }
    );
  }
}
