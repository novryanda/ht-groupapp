import { z } from "zod";

// Enum untuk status pembayaran
export const StatusPembayaranEnum = z.enum(["UNPAID", "PARTIAL", "PAID"]);

// Enum untuk tipe transaksi keuangan
export const TipeTransaksiKeuanganEnum = z.enum([
  "PENERIMAAN_TBS",
  "PURCHASE_ORDER",
  "PEMBELIAN_LANGSUNG",
  "PENGIRIMAN_PRODUCT",
]);

// Schema untuk pembayaran hutang
export const pembayaranHutangSchema = z.object({
  hutangId: z.string().min(1, "Hutang ID wajib diisi"),
  jumlahBayar: z.number().positive("Jumlah bayar harus lebih dari 0"),
  metodePembayaran: z.string().optional(),
  nomorReferensi: z.string().optional(),
  keterangan: z.string().optional(),
  tanggalBayar: z.date().optional(),
});

export type PembayaranHutangInput = z.infer<typeof pembayaranHutangSchema>;

// Schema untuk penerimaan piutang
export const penerimaanPiutangSchema = z.object({
  piutangId: z.string().min(1, "Piutang ID wajib diisi"),
  jumlahTerima: z.number().positive("Jumlah terima harus lebih dari 0"),
  metodePembayaran: z.string().optional(),
  nomorReferensi: z.string().optional(),
  keterangan: z.string().optional(),
  tanggalTerima: z.date().optional(),
});

export type PenerimaanPiutangInput = z.infer<typeof penerimaanPiutangSchema>;

// Schema untuk query hutang
export const hutangQuerySchema = z.object({
  status: StatusPembayaranEnum.optional(),
  tipeTransaksi: TipeTransaksiKeuanganEnum.optional(),
  pihakKetigaId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export type HutangQueryInput = z.infer<typeof hutangQuerySchema>;

// Schema untuk query piutang
export const piutangQuerySchema = z.object({
  status: StatusPembayaranEnum.optional(),
  buyerId: z.string().optional(),
  contractId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export type PiutangQueryInput = z.infer<typeof piutangQuerySchema>;

// Schema untuk create hutang manual
export const createHutangSchema = z.object({
  tipeTransaksi: TipeTransaksiKeuanganEnum,
  referensiId: z.string(),
  referensiNomor: z.string(),
  tanggalTransaksi: z.date(),
  tanggalJatuhTempo: z.date().optional().nullable(),
  pihakKetigaId: z.string().optional().nullable(),
  pihakKetigaNama: z.string(),
  pihakKetigaTipe: z.string().optional().nullable(),
  totalNilai: z.number().min(0),
  keterangan: z.string().optional().nullable(),
});

export type CreateHutangInput = z.infer<typeof createHutangSchema>;

// Schema untuk create piutang manual
export const createPiutangSchema = z.object({
  tipeTransaksi: TipeTransaksiKeuanganEnum.default("PENGIRIMAN_PRODUCT"),
  referensiId: z.string(),
  referensiNomor: z.string(),
  tanggalTransaksi: z.date(),
  tanggalJatuhTempo: z.date().optional().nullable(),
  buyerId: z.string().optional().nullable(),
  buyerNama: z.string(),
  contractId: z.string().optional().nullable(),
  contractNumber: z.string().optional().nullable(),
  totalNilai: z.number().min(0),
  keterangan: z.string().optional().nullable(),
});

export type CreatePiutangInput = z.infer<typeof createPiutangSchema>;
