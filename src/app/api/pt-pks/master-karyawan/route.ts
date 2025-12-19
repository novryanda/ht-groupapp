import { requireAuthWithRole } from "@/lib/api-auth";
import { masterKaryawanService } from "@/server/services/pt-pks/master-karyawan.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/master-karyawan - Get all master karyawan
export async function GET(request: Request) {
  const { error } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
    "Staff PT PKS",
  ]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const devisi = searchParams.get("devisi") || undefined;
    const isActive = searchParams.get("isActive");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");

    // Get devisi list
    if (searchParams.get("devisiList") === "true") {
      const devisiList = await masterKaryawanService.getDevisiList();
      return NextResponse.json({ devisi: devisiList });
    }

    const result = await masterKaryawanService.getMasterKaryawan({
      search,
      devisi,
      isActive: isActive ? isActive === "true" : undefined,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error fetching master karyawan:", error);
    return NextResponse.json(
      { error: "Failed to fetch master karyawan" },
      { status: 500 }
    );
  }
}

// POST /api/pt-pks/master-karyawan - Create new master karyawan
export async function POST(request: Request) {
  const { error } = await requireAuthWithRole(["Admin", "Manager PT PKS"]);
  if (error) return error;

  try {
    const body = await request.json();
    const karyawan = await masterKaryawanService.createMasterKaryawan(body);

    return NextResponse.json({
      message: "Master karyawan created successfully",
      karyawan,
    });
  } catch (error: unknown) {
    console.error("Error creating master karyawan:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create master karyawan" },
      { status: 500 }
    );
  }
}
