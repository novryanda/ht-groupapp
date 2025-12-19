import { requireAuthWithRole } from "@/lib/api-auth";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/pt-pks/contract/[id]/deliveries - Get all deliveries for a contract
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

    // Get contract with items and calculate original quantities
    const contract = await db.contract.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        buyer: true,
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

    // Get all deliveries for this contract
    const deliveries = await db.pengirimanProduct.findMany({
      where: {
        contractId: id,
        companyId,
      },
      include: {
        buyer: true,
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
      orderBy: {
        tanggalPengiriman: "desc",
      },
    });

    // Calculate delivery summary per contract item
    const itemSummaries = contract.contractItems.map((item) => {
      // Get all deliveries for this item
      const itemDeliveries = deliveries.filter(
        (d) => d.contractItemId === item.id
      );

      // Quantity kontrak tetap (tidak berubah)
      const contractQuantity = item.quantity;
      
      // Jumlah yang sudah dikirim (dari field deliveredQuantity)
      const deliveredQuantity = item.deliveredQuantity;

      // Sisa yang harus dikirim
      const remainingQuantity = Math.max(0, contractQuantity - deliveredQuantity);

      // Delivery percentage
      const deliveryPercentage = contractQuantity > 0 
        ? (deliveredQuantity / contractQuantity) * 100 
        : 0;

      return {
        contractItemId: item.id,
        materialId: item.materialId,
        materialCode: item.material.code,
        materialName: item.material.name,
        satuan: item.material.satuan,
        contractQuantity, // Kuantitas kontrak asli
        deliveredQuantity, // Jumlah yang sudah dikirim
        remainingQuantity, // Sisa yang harus dikirim
        deliveryPercentage,
        unitPrice: item.unitPrice,
        totalValue: contractQuantity * item.unitPrice,
        deliveredValue: deliveredQuantity * item.unitPrice,
        remainingValue: remainingQuantity * item.unitPrice,
        deliveryCount: itemDeliveries.filter((d) => d.status === "COMPLETED").length,
      };
    });

    // Overall summary
    const overallSummary = {
      totalItems: contract.contractItems.length,
      totalDeliveries: deliveries.filter((d) => d.status === "COMPLETED").length,
      totalDeliveredWeight: deliveries
        .filter((d) => d.status === "COMPLETED")
        .reduce((sum, d) => sum + d.beratNetto, 0),
      pendingDeliveries: deliveries.filter((d) => d.status === "DRAFT").length,
      cancelledDeliveries: deliveries.filter((d) => d.status === "CANCELLED").length,
    };

    return NextResponse.json({
      contract: {
        id: contract.id,
        contractNumber: contract.contractNumber,
        status: contract.status,
        buyer: contract.buyer,
        startDate: contract.startDate,
        endDate: contract.endDate,
        deliveryDate: contract.deliveryDate,
        deliveryAddress: contract.deliveryAddress,
      },
      itemSummaries,
      deliveries,
      overallSummary,
    });
  } catch (error: any) {
    console.error("Error fetching contract deliveries:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch contract deliveries" },
      { status: 500 }
    );
  }
}
