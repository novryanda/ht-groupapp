import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { neracaService } from "@/server/services/pt-pks/neraca.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const detail = await neracaService.getAsetDetail(session.user.company.id);
    return NextResponse.json(detail);
  } catch (error) {
    console.error("Error fetching aset detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch aset detail" },
      { status: 500 }
    );
  }
}
