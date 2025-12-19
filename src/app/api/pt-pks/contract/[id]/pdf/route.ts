import { requireAuthWithRole } from "@/lib/api-auth";
import { db } from "@/server/db";
import { NextResponse } from "next/server";
import { generateContractPDF } from "@/lib/pdf/pt-pks/generate-contract-pdf";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/pt-pks/contract/[id]/pdf - Generate contract PDF
export async function GET(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
    "Staff PT PKS",
  ]);
  if (error) return error;

  try {
    const { id } = params;

    // Get companyId from session
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    // Get contract with full details
    const contract = await db.contract.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        buyer: true,
        company: true,
        contractItems: {
          include: {
            material: {
              include: {
                satuan: true,
              },
            },
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Kontrak tidak ditemukan" },
        { status: 404 }
      );
    }

    // Prepare data for PDF
    const pdfData = {
      id: contract.id,
      contractNumber: contract.contractNumber,
      contractDate: contract.contractDate.toISOString(),
      startDate: contract.startDate.toISOString(),
      endDate: contract.endDate.toISOString(),
      deliveryDate: contract.deliveryDate.toISOString(),
      deliveryAddress: contract.deliveryAddress,
      notes: contract.notes,
      status: contract.status,
      subtotal: contract.subtotal,
      taxAmount: contract.taxAmount,
      totalAmount: contract.totalAmount,
      buyer: {
        id: contract.buyer.id,
        code: contract.buyer.code,
        name: contract.buyer.name,
        contactPerson: contract.buyer.contactPerson,
        phone: contract.buyer.phone,
        email: contract.buyer.email,
        address: contract.buyer.address,
        npwp: contract.buyer.npwp,
        taxStatus: contract.buyer.taxStatus,
      },
      company: {
        id: contract.company.id,
        code: contract.company.code,
        name: contract.company.name,
      },
      contractItems: contract.contractItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: item.notes,
        material: {
          id: item.material.id,
          code: item.material.code,
          name: item.material.name,
          satuan: {
            name: item.material.satuan.name,
            symbol: item.material.satuan.symbol,
          },
        },
      })),
    };

    // Generate PDF using helper function
    const buffer = await generateContractPDF(pdfData);

    // Return PDF response
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Contract-${contract.contractNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating contract PDF:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate contract PDF" },
      { status: 500 }
    );
  }
}
