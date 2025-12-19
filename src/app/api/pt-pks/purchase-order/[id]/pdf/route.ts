import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { generateInvoicePOPDF } from "@/lib/pdf/pt-pks/generate-invoices";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        purchaseRequest: true,
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

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: "Purchase Order tidak ditemukan" },
        { status: 404 }
      );
    }

    const pdfData = {
      id: purchaseOrder.id,
      nomorPO: purchaseOrder.nomorPO,
      tanggalPO: purchaseOrder.tanggalPO.toISOString(),
      vendorName: purchaseOrder.vendorName,
      vendorAddress: purchaseOrder.vendorAddress || undefined,
      vendorPhone: purchaseOrder.vendorPhone || undefined,
      tanggalKirimDiharapkan: purchaseOrder.tanggalKirimDiharapkan?.toISOString(),
      termPembayaran: purchaseOrder.termPembayaran || undefined,
      issuedBy: purchaseOrder.issuedBy,
      approvedBy: purchaseOrder.approvedBy || undefined,
      tanggalApproval: purchaseOrder.tanggalApproval?.toISOString(),
      subtotal: purchaseOrder.subtotal,
      taxPercent: purchaseOrder.taxPercent,
      taxAmount: purchaseOrder.taxAmount,
      discountType: purchaseOrder.discountType || undefined,
      discountPercent: purchaseOrder.discountPercent,
      discountAmount: purchaseOrder.discountAmount,
      shipping: purchaseOrder.shipping,
      totalAmount: purchaseOrder.totalAmount,
      keterangan: purchaseOrder.keterangan || undefined,
      status: purchaseOrder.status,
      purchaseRequest: purchaseOrder.purchaseRequest
        ? {
            id: purchaseOrder.purchaseRequest.id,
            nomorPR: purchaseOrder.purchaseRequest.nomorPR,
            tanggalRequest: purchaseOrder.purchaseRequest.tanggalRequest.toISOString(),
            requestedBy: purchaseOrder.purchaseRequest.requestedBy,
            divisi: purchaseOrder.purchaseRequest.divisi || undefined,
          }
        : undefined,
      items: purchaseOrder.items.map((item) => ({
        id: item.id,
        jumlahOrder: item.jumlahOrder,
        jumlahDiterima: item.jumlahDiterima,
        hargaSatuan: item.hargaSatuan,
        subtotal: item.subtotal,
        keterangan: item.keterangan || undefined,
        material: {
          id: item.material.id,
          partNumber: item.material.partNumber,
          namaMaterial: item.material.namaMaterial,
          satuanMaterial: {
            symbol: item.material.satuanMaterial.symbol,
          },
          kategoriMaterial: {
            namaKategori: item.material.kategoriMaterial.name,
          },
        },
      })),
    };

    const pdfBuffer = await generateInvoicePOPDF(pdfData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="PO-${purchaseOrder.nomorPO}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PO PDF:", error);
    return NextResponse.json(
      { error: "Gagal generate PDF" },
      { status: 500 }
    );
  }
}
