import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { hutangService } from "@/server/services/pt-pks/hutang.service";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await hutangService.syncAll(session.user.company.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error syncing hutang:", error);
    return NextResponse.json(
      { error: "Failed to sync hutang" },
      { status: 500 }
    );
  }
}
