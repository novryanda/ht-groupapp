import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { piutangService } from "@/server/services/pt-pks/piutang.service";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await piutangService.syncAll(session.user.company.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error syncing piutang:", error);
    return NextResponse.json(
      { error: "Failed to sync piutang" },
      { status: 500 }
    );
  }
}
