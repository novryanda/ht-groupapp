import { requireAuthWithRole } from "@/lib/api-auth";
import { masterKaryawanService } from "@/server/services/pt-pks/master-karyawan.service";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/pt-pks/master-karyawan/[id] - Get master karyawan by id
export async function GET(request: Request, { params }: RouteParams) {
  const { error } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
    "Staff PT PKS",
  ]);
  if (error) return error;

  try {
    const { id } = await params;
    const karyawan = await masterKaryawanService.getMasterKaryawanById(id);

    return NextResponse.json({ karyawan });
  } catch (error: unknown) {
    console.error("Error fetching master karyawan:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to fetch master karyawan" },
      { status: 500 }
    );
  }
}

// PUT /api/pt-pks/master-karyawan/[id] - Update master karyawan
export async function PUT(request: Request, { params }: RouteParams) {
  const { error } = await requireAuthWithRole(["Admin", "Manager PT PKS"]);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    const karyawan = await masterKaryawanService.updateMasterKaryawan(id, body);

    return NextResponse.json({
      message: "Master karyawan updated successfully",
      karyawan,
    });
  } catch (error: unknown) {
    console.error("Error updating master karyawan:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update master karyawan" },
      { status: 500 }
    );
  }
}

// DELETE /api/pt-pks/master-karyawan/[id] - Delete master karyawan
export async function DELETE(request: Request, { params }: RouteParams) {
  const { error } = await requireAuthWithRole(["Admin", "Manager PT PKS"]);
  if (error) return error;

  try {
    const { id } = await params;
    await masterKaryawanService.deleteMasterKaryawan(id);

    return NextResponse.json({
      message: "Master karyawan deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting master karyawan:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to delete master karyawan" },
      { status: 500 }
    );
  }
}
