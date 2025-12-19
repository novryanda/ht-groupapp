import { db } from "@/server/db";
import type {
  CreatePenggajianInput,
  UpdatePenggajianInput,
  PenggajianQueryInput,
} from "@/server/schema/penggajian";
import type { Prisma } from "@prisma/client";

export class PenggajianRepository {
  /**
   * Get all penggajian with pagination and filters
   */
  async findAll(query?: PenggajianQueryInput) {
    const where: Prisma.PenggajianKaryawanWhereInput = {};

    // Search filter
    if (query?.search) {
      where.OR = [
        { namaKaryawan: { contains: query.search, mode: "insensitive" } },
        { jabatan: { contains: query.search, mode: "insensitive" } },
        { nomorRekening: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // Devisi filter
    if (query?.devisi) {
      where.devisi = query.devisi;
    }

    // Periode filter
    if (query?.periodeBulan) {
      where.periodeBulan = query.periodeBulan;
    }
    if (query?.periodeTahun) {
      where.periodeTahun = query.periodeTahun;
    }

    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      db.penggajianKaryawan.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { devisi: "asc" },
          { no: "asc" },
          { namaKaryawan: "asc" },
        ],
      }),
      db.penggajianKaryawan.count({ where }),
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
  }

  /**
   * Get penggajian by id
   */
  async findById(id: string) {
    return db.penggajianKaryawan.findUnique({
      where: { id },
    });
  }

  /**
   * Get distinct devisi list
   */
  async getDistinctDevisi() {
    const result = await db.penggajianKaryawan.findMany({
      select: { devisi: true },
      distinct: ["devisi"],
      where: { devisi: { not: null } },
      orderBy: { devisi: "asc" },
    });
    return result.map((r: { devisi: string | null }) => r.devisi).filter(Boolean);
  }

  /**
   * Get distinct periode (bulan + tahun)
   */
  async getDistinctPeriode() {
    const result = await db.penggajianKaryawan.findMany({
      select: { periodeBulan: true, periodeTahun: true },
      distinct: ["periodeBulan", "periodeTahun"],
      orderBy: [{ periodeTahun: "desc" }, { periodeBulan: "desc" }],
    });
    return result;
  }

  /**
   * Create new penggajian
   */
  async create(data: CreatePenggajianInput) {
    return db.penggajianKaryawan.create({
      data: {
        ...data,
        masterKaryawanId: data.masterKaryawanId ?? undefined,
        tanggalKerja: data.tanggalKerja as Prisma.InputJsonValue ?? undefined,
        lemburDetail: data.lemburDetail as Prisma.InputJsonValue ?? undefined,
      },
    });
  }

  /**
   * Create many penggajian (bulk insert)
   */
  async createMany(dataList: CreatePenggajianInput[]) {
    return db.penggajianKaryawan.createMany({
      data: dataList.map((data) => ({
        ...data,
        masterKaryawanId: data.masterKaryawanId ?? undefined,
        tanggalKerja: data.tanggalKerja as Prisma.InputJsonValue ?? undefined,
        lemburDetail: data.lemburDetail as Prisma.InputJsonValue ?? undefined,
      })),
    });
  }

  /**
   * Update penggajian
   */
  async update(id: string, data: UpdatePenggajianInput) {
    return db.penggajianKaryawan.update({
      where: { id },
      data: {
        ...data,
        masterKaryawanId: data.masterKaryawanId ?? undefined,
        tanggalKerja: data.tanggalKerja as Prisma.InputJsonValue ?? undefined,
        lemburDetail: data.lemburDetail as Prisma.InputJsonValue ?? undefined,
      },
    });
  }

  /**
   * Delete penggajian
   */
  async delete(id: string) {
    return db.penggajianKaryawan.delete({
      where: { id },
    });
  }

  /**
   * Delete all penggajian by periode
   */
  async deleteByPeriode(periodeBulan: number, periodeTahun: number) {
    return db.penggajianKaryawan.deleteMany({
      where: {
        periodeBulan,
        periodeTahun,
      },
    });
  }

  /**
   * Check if periode exists
   */
  async isPeriodeExists(periodeBulan: number, periodeTahun: number) {
    const count = await db.penggajianKaryawan.count({
      where: {
        periodeBulan,
        periodeTahun,
      },
    });
    return count > 0;
  }

  /**
   * Get summary statistics
   */
  async getSummary(periodeBulan?: number, periodeTahun?: number) {
    const where: Prisma.PenggajianKaryawanWhereInput = {};
    if (periodeBulan) where.periodeBulan = periodeBulan;
    if (periodeTahun) where.periodeTahun = periodeTahun;

    const [count, aggregate] = await Promise.all([
      db.penggajianKaryawan.count({ where }),
      db.penggajianKaryawan.aggregate({
        where,
        _sum: {
          gajiPokok: true,
          tunjanganJabatan: true,
          tunjanganPerumahan: true,
          overtime: true,
          lemburHari: true,
          totalSebelumPotongan: true,
          potKehadiran: true,
          potBpjsTkJht: true,
          potBpjsTkJn: true,
          potBpjsKesehatan: true,
          potPph21: true,
          totalPotongan: true,
          upahDiterima: true,
        },
      }),
    ]);

    return {
      totalKaryawan: count,
      totalGajiPokok: aggregate._sum.gajiPokok || 0,
      totalTunjanganJabatan: aggregate._sum.tunjanganJabatan || 0,
      totalTunjanganPerumahan: aggregate._sum.tunjanganPerumahan || 0,
      totalOvertime: aggregate._sum.overtime || 0,
      totalSebelumPotongan: aggregate._sum.totalSebelumPotongan || 0,
      totalPotKehadiran: aggregate._sum.potKehadiran || 0,
      totalPotBpjsTkJht: aggregate._sum.potBpjsTkJht || 0,
      totalPotBpjsTkJn: aggregate._sum.potBpjsTkJn || 0,
      totalPotBpjsKesehatan: aggregate._sum.potBpjsKesehatan || 0,
      totalPotPph21: aggregate._sum.potPph21 || 0,
      totalPotongan: aggregate._sum.totalPotongan || 0,
      totalUpahDiterima: aggregate._sum.upahDiterima || 0,
    };
  }
}

export const penggajianRepository = new PenggajianRepository();
