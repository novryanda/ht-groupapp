import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";

export type MasterKaryawanQueryInput = {
  search?: string;
  devisi?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

export type CreateMasterKaryawanInput = {
  namaKaryawan: string;
  tktk?: string | null;
  gol?: string | null;
  nomorRekening?: string | null;
  devisi?: string | null;
  noBpjsTk?: string | null;
  noBpjsKesehatan?: string | null;
  jabatan?: string | null;
  gajiPokok?: number;
  tunjanganJabatan?: number;
  tunjanganPerumahan?: number;
  pctBpjsTkJht?: number;
  pctBpjsTkJn?: number;
  pctBpjsKesehatan?: number;
  isActive?: boolean;
  tanggalMulaiKerja?: Date | null;
};

export type UpdateMasterKaryawanInput = Partial<CreateMasterKaryawanInput>;

export const masterKaryawanRepository = {
  /**
   * Find all master karyawan with pagination and filters
   */
  async findAll(query?: MasterKaryawanQueryInput) {
    const { search, devisi, isActive, page = 1, limit = 100 } = query || {};
    const skip = (page - 1) * limit;

    const where: Prisma.MasterKaryawanWhereInput = {};

    if (search) {
      where.OR = [
        { namaKaryawan: { contains: search, mode: "insensitive" } },
        { jabatan: { contains: search, mode: "insensitive" } },
        { nomorRekening: { contains: search, mode: "insensitive" } },
      ];
    }

    if (devisi) {
      where.devisi = devisi;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      db.masterKaryawan.findMany({
        where,
        orderBy: [{ devisi: "asc" }, { namaKaryawan: "asc" }],
        skip,
        take: limit,
      }),
      db.masterKaryawan.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Find master karyawan by id
   */
  async findById(id: string) {
    return db.masterKaryawan.findUnique({ where: { id } });
  },

  /**
   * Find master karyawan by name (exact match)
   */
  async findByName(namaKaryawan: string) {
    return db.masterKaryawan.findFirst({
      where: { namaKaryawan: { equals: namaKaryawan, mode: "insensitive" } },
    });
  },

  /**
   * Get distinct devisi list
   */
  async getDistinctDevisi() {
    const result = await db.masterKaryawan.findMany({
      select: { devisi: true },
      distinct: ["devisi"],
      where: { devisi: { not: null } },
      orderBy: { devisi: "asc" },
    });
    return result.map((r) => r.devisi).filter(Boolean) as string[];
  },

  /**
   * Create new master karyawan
   */
  async create(data: CreateMasterKaryawanInput) {
    return db.masterKaryawan.create({
      data: {
        namaKaryawan: data.namaKaryawan,
        tktk: data.tktk,
        gol: data.gol,
        nomorRekening: data.nomorRekening,
        devisi: data.devisi,
        noBpjsTk: data.noBpjsTk,
        noBpjsKesehatan: data.noBpjsKesehatan,
        jabatan: data.jabatan,
        gajiPokok: data.gajiPokok || 0,
        tunjanganJabatan: data.tunjanganJabatan || 0,
        tunjanganPerumahan: data.tunjanganPerumahan || 0,
        pctBpjsTkJht: data.pctBpjsTkJht ?? 2,
        pctBpjsTkJn: data.pctBpjsTkJn ?? 1,
        pctBpjsKesehatan: data.pctBpjsKesehatan ?? 1,
        isActive: data.isActive ?? true,
        tanggalMulaiKerja: data.tanggalMulaiKerja,
      },
    });
  },

  /**
   * Create many master karyawan
   */
  async createMany(data: CreateMasterKaryawanInput[]) {
    return db.masterKaryawan.createMany({
      data: data.map((d) => ({
        namaKaryawan: d.namaKaryawan,
        tktk: d.tktk,
        gol: d.gol,
        nomorRekening: d.nomorRekening,
        devisi: d.devisi,
        noBpjsTk: d.noBpjsTk,
        noBpjsKesehatan: d.noBpjsKesehatan,
        jabatan: d.jabatan,
        gajiPokok: d.gajiPokok || 0,
        tunjanganJabatan: d.tunjanganJabatan || 0,
        tunjanganPerumahan: d.tunjanganPerumahan || 0,
        pctBpjsTkJht: d.pctBpjsTkJht ?? 2,
        pctBpjsTkJn: d.pctBpjsTkJn ?? 1,
        pctBpjsKesehatan: d.pctBpjsKesehatan ?? 1,
        isActive: d.isActive ?? true,
        tanggalMulaiKerja: d.tanggalMulaiKerja,
      })),
      skipDuplicates: true,
    });
  },

  /**
   * Update master karyawan
   */
  async update(id: string, data: UpdateMasterKaryawanInput) {
    return db.masterKaryawan.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete master karyawan
   */
  async delete(id: string) {
    return db.masterKaryawan.delete({ where: { id } });
  },

  /**
   * Get all active karyawan for generating penggajian
   */
  async getActiveKaryawan() {
    return db.masterKaryawan.findMany({
      where: { isActive: true },
      orderBy: [{ devisi: "asc" }, { namaKaryawan: "asc" }],
    });
  },
};
