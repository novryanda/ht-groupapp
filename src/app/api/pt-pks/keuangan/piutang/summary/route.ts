import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { piutangService } from "@/server/services/pt-pks/piutang.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = await piutangService.getSummary(session.user.company.id);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching piutang summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch piutang summary" },
      { status: 500 }
    );
  }
}
