import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { hutangService } from "@/server/services/pt-pks/hutang.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const hutang = await hutangService.getById(id, session.user.company.id);

    return NextResponse.json(hutang);
  } catch (error) {
    console.error("Error fetching hutang:", error);
    return NextResponse.json(
      { error: "Failed to fetch hutang" },
      { status: 500 }
    );
  }
}
