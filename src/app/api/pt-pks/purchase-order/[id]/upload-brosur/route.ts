import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// Max file size 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if PO exists
    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id },
      select: { id: true, nomorPO: true, brosurPdfPath: true },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: "Purchase Order tidak ditemukan" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Hanya file PDF yang diizinkan" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 10MB" },
        { status: 400 }
      );
    }

    // Create uploads directory if not exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "brosur-po");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Delete old file if exists
    if (purchaseOrder.brosurPdfPath) {
      const oldFilePath = path.join(process.cwd(), "public", purchaseOrder.brosurPdfPath);
      if (existsSync(oldFilePath)) {
        await unlink(oldFilePath);
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedNomorPO = purchaseOrder.nomorPO.replace(/[^a-zA-Z0-9]/g, "-");
    const fileName = `brosur-${sanitizedNomorPO}-${timestamp}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    const relativePath = `/uploads/brosur-po/${fileName}`;

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update database
    const updatedPO = await db.purchaseOrder.update({
      where: { id },
      data: {
        brosurPdfPath: relativePath,
        brosurPdfName: file.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: "File berhasil diupload",
      data: {
        brosurPdfPath: updatedPO.brosurPdfPath,
        brosurPdfName: updatedPO.brosurPdfName,
      },
    });
  } catch (error) {
    console.error("Error uploading brosur PDF:", error);
    return NextResponse.json(
      { error: "Gagal mengupload file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if PO exists
    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id },
      select: { id: true, brosurPdfPath: true },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: "Purchase Order tidak ditemukan" },
        { status: 404 }
      );
    }

    if (!purchaseOrder.brosurPdfPath) {
      return NextResponse.json(
        { error: "Tidak ada file brosur yang tersimpan" },
        { status: 400 }
      );
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), "public", purchaseOrder.brosurPdfPath);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    // Update database
    await db.purchaseOrder.update({
      where: { id },
      data: {
        brosurPdfPath: null,
        brosurPdfName: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "File brosur berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting brosur PDF:", error);
    return NextResponse.json(
      { error: "Gagal menghapus file" },
      { status: 500 }
    );
  }
}
