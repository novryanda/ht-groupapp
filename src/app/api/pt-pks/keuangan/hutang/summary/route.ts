import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { hutangService } from "@/server/services/pt-pks/hutang.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = await hutangService.getSummary(session.user.company.id);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching hutang summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch hutang summary" },
      { status: 500 }
    );
  }
}
