import React from "react";
import { renderToBuffer, Document } from "@react-pdf/renderer";
import { InvoiceSRPDF, type StoreRequestPDFData } from "./invoice-sr-pdf";
import { InvoicePRPDF, type PurchaseRequestPDFData } from "./invoice-pr-pdf";
import { InvoicePOPDF, type PurchaseOrderPDFData } from "./invoice-po-pdf";
import { InvoicePenerimaanBarangPDF, type PenerimaanBarangPDFData } from "./invoice-penerimaan-barang-pdf";
import { InvoicePengeluaranBarangPDF, type PengeluaranBarangPDFData } from "./invoice-pengeluaran-barang-pdf";

export async function generateInvoiceSRPDF(
  data: StoreRequestPDFData
): Promise<Buffer> {
  const pdfElement = (
    <Document>
      <InvoiceSRPDF data={data} />
    </Document>
  );
  const buffer = await renderToBuffer(pdfElement);
  return buffer;
}

export async function generateInvoicePRPDF(
  data: PurchaseRequestPDFData
): Promise<Buffer> {
  const pdfElement = (
    <Document>
      <InvoicePRPDF data={data} />
    </Document>
  );
  const buffer = await renderToBuffer(pdfElement);
  return buffer;
}

export async function generateInvoicePOPDF(
  data: PurchaseOrderPDFData
): Promise<Buffer> {
  const pdfElement = (
    <Document>
      <InvoicePOPDF data={data} />
    </Document>
  );
  const buffer = await renderToBuffer(pdfElement);
  return buffer;
}

export async function generateInvoicePenerimaanBarangPDF(
  data: PenerimaanBarangPDFData
): Promise<Buffer> {
  const pdfElement = (
    <Document>
      <InvoicePenerimaanBarangPDF data={data} />
    </Document>
  );
  const buffer = await renderToBuffer(pdfElement);
  return buffer;
}

export async function generateInvoicePengeluaranBarangPDF(
  data: PengeluaranBarangPDFData
): Promise<Buffer> {
  const pdfElement = (
    <Document>
      <InvoicePengeluaranBarangPDF data={data} />
    </Document>
  );
  const buffer = await renderToBuffer(pdfElement);
  return buffer;
}

// Re-export types for convenience
export type {
  StoreRequestPDFData,
  PurchaseRequestPDFData,
  PurchaseOrderPDFData,
  PenerimaanBarangPDFData,
  PengeluaranBarangPDFData,
};
