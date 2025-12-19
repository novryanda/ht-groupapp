import { requireAuthWithRole } from "@/lib/api-auth";
import { pengirimanProductService } from "@/server/services/pt-pks/pengiriman-product.service";
import { NextResponse } from "next/server";
import { updatePengirimanProductSchema } from "@/server/schema/pengiriman-product";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/pt-pks/pengiriman-product/[id] - Get pengiriman by id
export async function GET(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
    "Staff PT PKS",
  ]);
  if (error) return error;

  try {
    const { id } = params;

    const pengiriman = await pengirimanProductService.getPengirimanProductById(id);

    return NextResponse.json({ pengiriman });
  } catch (error: any) {
    console.error("Error fetching pengiriman:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pengiriman" },
      { status: 404 }
    );
  }
}

// PUT /api/pt-pks/pengiriman-product/[id] - Update pengiriman
export async function PUT(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
    "Staff PT PKS",
  ]);
  if (error) return error;

  try {
    const { id } = params;
    const body = await request.json();

    // Parse dates if they exist
    const parsedData: any = { ...body };
    if (body.tanggalPengiriman) parsedData.tanggalPengiriman = new Date(body.tanggalPengiriman);
    if (body.waktuTimbangTarra) parsedData.waktuTimbangTarra = new Date(body.waktuTimbangTarra);
    if (body.waktuTimbangGross) parsedData.waktuTimbangGross = new Date(body.waktuTimbangGross);

    const validatedData = updatePengirimanProductSchema.parse(parsedData);

    const pengiriman = await pengirimanProductService.updatePengirimanProduct(id, validatedData);

    return NextResponse.json({ pengiriman });
  } catch (error: any) {
    console.error("Error updating pengiriman:", error);

    if (error.errors) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update pengiriman" },
      { status: 400 }
    );
  }
}

// DELETE /api/pt-pks/pengiriman-product/[id] - Delete pengiriman
export async function DELETE(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
  ]);
  if (error) return error;

  try {
    const { id } = params;

    await pengirimanProductService.deletePengirimanProduct(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting pengiriman:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete pengiriman" },
      { status: 400 }
    );
  }
}
