import { z } from "zod";

// Schema untuk Purchase Order Item
export const purchaseOrderItemSchema = z.object({
  materialId: z.string().min(1, "Material wajib dipilih"),
  jumlahOrder: z.number().min(0.01, "Jumlah harus lebih dari 0"),
  hargaSatuan: z.number().min(0, "Harga satuan harus lebih dari 0"),
  keterangan: z.string().optional(),
});

// Schema untuk Purchase Order
export const purchaseOrderSchema = z.object({
  purchaseRequestId: z.string().optional(),
  vendorName: z.string().min(1, "Nama vendor wajib diisi"),
  vendorAddress: z.string().optional(),
  vendorPhone: z.string().optional(),
  tanggalKirimDiharapkan: z.string().optional(),
  termPembayaran: z.string().optional(),
  issuedBy: z.string().min(1, "Issued by wajib diisi"),
  taxPercent: z.number().min(0).max(100).default(0), // PPN dalam persen
  discountType: z.enum(["PERCENT", "AMOUNT"]).optional(), // Tipe diskon
  discountPercent: z.number().min(0).max(100).default(0), // Diskon dalam persen
  discountAmount: z.number().min(0).default(0), // Diskon dalam nominal
  shipping: z.number().min(0).default(0),
  keterangan: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, "Minimal 1 item"),
});

export const updatePurchaseOrderSchema = z.object({
  vendorName: z.string().optional(),
  vendorAddress: z.string().optional(),
  vendorPhone: z.string().optional(),
  tanggalKirimDiharapkan: z.string().optional(),
  termPembayaran: z.string().optional(),
  taxPercent: z.number().min(0).max(100).optional(),
  discountType: z.enum(["PERCENT", "AMOUNT"]).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  shipping: z.number().optional(),
  keterangan: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).optional(),
});

export const approvePurchaseOrderSchema = z.object({
  approvedBy: z.string().min(1, "Nama approver wajib diisi"),
});

export const issuePurchaseOrderSchema = z.object({
  issuedBy: z.string().min(1, "Issued by wajib diisi"),
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type ApprovePurchaseOrderInput = z.infer<typeof approvePurchaseOrderSchema>;
export type IssuePurchaseOrderInput = z.infer<typeof issuePurchaseOrderSchema>;
