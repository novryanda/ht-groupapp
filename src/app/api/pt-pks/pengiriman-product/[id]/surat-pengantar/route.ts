import { requireAuthWithRole } from "@/lib/api-auth";
import { db } from "@/server/db";
import { NextResponse } from "next/server";
import { generateSuratPengantarPDF } from "@/lib/pdf/pt-pks/generate-surat-pengantar";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/pt-pks/pengiriman-product/[id]/surat-pengantar - Generate Surat Pengantar PDF
export async function GET(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
    "Staff PT PKS",
  ]);
  if (error) return error;

  try {
    const { id } = params;

    // Get pengiriman with full details
    const pengiriman = await db.pengirimanProduct.findUnique({
      where: { id },
      include: {
        buyer: true,
        company: true,
        contract: {
          include: {
            buyer: true,
          },
        },
        contractItem: {
          include: {
            material: {
              include: {
                satuan: true,
              },
            },
          },
        },
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
      },
    });

    if (!pengiriman) {
      return NextResponse.json(
        { error: "Pengiriman tidak ditemukan" },
        { status: 404 }
      );
    }

    // Prepare data for PDF
    const pdfData = {
      nomorPengiriman: pengiriman.nomorPengiriman,
      noSegel: pengiriman.noSegel,
      tanggalPengiriman: pengiriman.tanggalPengiriman.toISOString(),
      operatorPenimbang: pengiriman.operatorPenimbang,
      buyer: {
        name: pengiriman.buyer.name,
        code: pengiriman.buyer.code,
        address: pengiriman.buyer.address,
        contactPerson: pengiriman.buyer.contactPerson,
        phone: pengiriman.buyer.phone,
      },
      contract: {
        contractNumber: pengiriman.contract.contractNumber,
        deliveryDate: pengiriman.contract.deliveryDate.toISOString(),
      },
      contractItem: {
        material: {
          name: pengiriman.contractItem.material.name,
          code: pengiriman.contractItem.material.code,
          satuan: {
            name: pengiriman.contractItem.material.satuan.name,
            symbol: pengiriman.contractItem.material.satuan.symbol,
          },
        },
      },
      vendorVehicle: {
        nomorKendaraan: pengiriman.vendorVehicle.nomorKendaraan,
        namaSupir: pengiriman.vendorVehicle.namaSupir,
        noHpSupir: pengiriman.vendorVehicle.noHpSupir,
        vendor: {
          name: pengiriman.vendorVehicle.vendor.name,
          code: pengiriman.vendorVehicle.vendor.code,
        },
      },
      beratTarra: pengiriman.beratTarra,
      beratGross: pengiriman.beratGross,
      beratNetto: pengiriman.beratNetto,
      ffa: pengiriman.ffa,
      air: pengiriman.air,
      kotoran: pengiriman.kotoran,
      waktuTimbangTarra: pengiriman.waktuTimbangTarra.toISOString(),
      waktuTimbangGross: pengiriman.waktuTimbangGross.toISOString(),
      company: {
        name: pengiriman.company.name,
        code: pengiriman.company.code,
      },
    };

    // Generate PDF using helper function
    const buffer = await generateSuratPengantarPDF(pdfData);

    // Return PDF response
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="SuratPengantar-${pengiriman.nomorPengiriman}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating surat pengantar PDF:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate surat pengantar PDF" },
      { status: 500 }
    );
  }
}
