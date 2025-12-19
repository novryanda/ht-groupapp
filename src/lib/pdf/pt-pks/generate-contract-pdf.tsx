import React from "react";
import { renderToBuffer, Document } from "@react-pdf/renderer";
import { ContractPDF } from "./contract-pdf";

type ContractItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string | null;
  material: {
    id: string;
    code: string;
    name: string;
    satuan: {
      name: string;
      symbol: string;
    };
  };
};

type ContractData = {
  id: string;
  contractNumber: string;
  contractDate: Date | string;
  startDate: Date | string;
  endDate: Date | string;
  deliveryDate: Date | string;
  deliveryAddress: string;
  notes?: string | null;
  status: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  buyer: {
    id: string;
    code: string;
    name: string;
    contactPerson: string;
    phone: string;
    email?: string | null;
    address: string;
    npwp?: string | null;
    taxStatus: string;
  };
  company: {
    id: string;
    code: string;
    name: string;
  };
  contractItems: ContractItem[];
};

export async function generateContractPDF(
  data: ContractData,
): Promise<Buffer> {
  const pdfElement = <ContractPDF data={data} />;
  const buffer = await renderToBuffer(pdfElement);
  return buffer;
}
