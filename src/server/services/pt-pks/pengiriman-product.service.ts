import { pengirimanProductRepository } from "@/server/repositories/pengiriman-product.repository";
import { contractRepository } from "@/server/repositories/contract.repository";
import { materialRepository } from "@/server/repositories/material.repository";
import { db } from "@/server/db";
import type { CreatePengirimanProductInput, UpdatePengirimanProductInput } from "@/server/schema/pengiriman-product";

export class PengirimanProductService {
  async createPengirimanProduct(
    companyId: string,
    data: CreatePengirimanProductInput
  ) {
    // Validasi contract item
    const contractItem = await db.contractItem.findUnique({
      where: { id: data.contractItemId },
      include: {
        contract: true,
        material: true,
      },
    });

    if (!contractItem) {
      throw new Error("Item kontrak tidak ditemukan");
    }

    // Validasi stock material
    const stock = await db.stockMaterial.findUnique({
      where: {
        companyId_materialId: {
          companyId,
          materialId: contractItem.materialId,
        },
      },
    });

    const beratNetto = data.beratGross - data.beratTarra;

    if (!stock || stock.jumlah < beratNetto) {
      throw new Error(`Stock material tidak mencukupi. Stock tersedia: ${stock?.jumlah || 0} kg`);
    }

    // Create pengiriman
    const pengiriman = await pengirimanProductRepository.createPengirimanProduct(companyId, data);

    // Update stock material dan contract jika status COMPLETED
    if (data.status === "COMPLETED") {
      await this.processCompletedPengiriman(companyId, pengiriman.id, pengiriman.nomorPengiriman, data.operatorPenimbang);
    }

    return pengiriman;
  }

  async processCompletedPengiriman(
    companyId: string,
    pengirimanId: string,
    nomorPengiriman: string,
    operator: string
  ) {
    const pengiriman = await pengirimanProductRepository.getPengirimanProductById(pengirimanId);
    
    if (!pengiriman) {
      throw new Error("Pengiriman tidak ditemukan");
    }

    const materialId = pengiriman.contractItem.materialId;
    const beratNetto = pengiriman.beratNetto;

    // 1. Update stock material (kurangi stock)
    const currentStock = await db.stockMaterial.findUnique({
      where: {
        companyId_materialId: {
          companyId,
          materialId,
        },
      },
    });

    if (!currentStock) {
      throw new Error("Stock material tidak ditemukan");
    }

    const newStock = currentStock.jumlah - beratNetto;

    if (newStock < 0) {
      throw new Error("Stock material tidak mencukupi");
    }

    await db.stockMaterial.update({
      where: {
        companyId_materialId: {
          companyId,
          materialId,
        },
      },
      data: {
        jumlah: newStock,
      },
    });

    // 2. Create stock movement record
    await db.stockMovement.create({
      data: {
        companyId,
        materialId,
        tipeMovement: "OUT",
        jumlah: beratNetto,
        stockSebelum: currentStock.jumlah,
        stockSesudah: newStock,
        referensi: nomorPengiriman,
        keterangan: `Pengiriman ke buyer: ${pengiriman.buyer.name}`,
        operator,
      },
    });

    // 3. Update contract item (tambah deliveredQuantity)
    const contractItem = await db.contractItem.findUnique({
      where: { id: pengiriman.contractItemId },
    });

    if (contractItem) {
      const newDeliveredQuantity = contractItem.deliveredQuantity + beratNetto;
      
      await db.contractItem.update({
        where: { id: pengiriman.contractItemId },
        data: {
          deliveredQuantity: newDeliveredQuantity,
        },
      });

      // 4. Check if contract should be completed (semua item sudah terkirim penuh)
      const allContractItems = await db.contractItem.findMany({
        where: { contractId: pengiriman.contractId },
      });

      const allItemsCompleted = allContractItems.every((item: any) => {
        if (item.id === pengiriman.contractItemId) {
          return newDeliveredQuantity >= item.quantity;
        }
        return item.deliveredQuantity >= item.quantity;
      });

      if (allItemsCompleted) {
        await db.contract.update({
          where: { id: pengiriman.contractId },
          data: {
            status: "COMPLETED",
          },
        });
      }
    }

    // 5. Update stock tangki jika material ada di tangki
    const tangki = await db.tangki.findFirst({
      where: {
        companyId,
        materialId,
      },
    });

    if (tangki) {
      const newTangkiStock = tangki.isiSaatIni - beratNetto;

      await db.tangki.update({
        where: { id: tangki.id },
        data: {
          isiSaatIni: newTangkiStock >= 0 ? newTangkiStock : 0,
        },
      });

      // Create stock tangki record
      await db.stockTangki.create({
        data: {
          tangkiId: tangki.id,
          tipeTransaksi: "KELUAR",
          jumlah: beratNetto,
          stockSebelum: tangki.isiSaatIni,
          stockSesudah: newTangkiStock >= 0 ? newTangkiStock : 0,
          referensi: nomorPengiriman,
          keterangan: `Pengiriman ke buyer: ${pengiriman.buyer.name}`,
          operator,
        },
      });
    }
  }

  async getPengirimanProductByCompany(companyId: string, filters?: {
    status?: string;
    buyerId?: string;
    contractId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return pengirimanProductRepository.getPengirimanProductByCompany(companyId, filters);
  }

  async getPengirimanProductById(id: string) {
    const pengiriman = await pengirimanProductRepository.getPengirimanProductById(id);
    if (!pengiriman) {
      throw new Error("Pengiriman product tidak ditemukan");
    }
    return pengiriman;
  }

  async updatePengirimanProduct(id: string, data: UpdatePengirimanProductInput) {
    const current = await pengirimanProductRepository.getPengirimanProductById(id);
    if (!current) {
      throw new Error("Pengiriman product tidak ditemukan");
    }

    // If changing to COMPLETED status
    if (data.status === "COMPLETED" && current.status !== "COMPLETED") {
      // First update the pengiriman
      const updated = await pengirimanProductRepository.updatePengirimanProduct(id, data);
      
      // Then process the completion
      await this.processCompletedPengiriman(
        current.companyId,
        id,
        current.nomorPengiriman,
        current.operatorPenimbang
      );
      
      return updated;
    }

    // If changing from COMPLETED to other status, need to reverse the stock changes
    if (data.status !== "COMPLETED" && current.status === "COMPLETED") {
      await this.reverseCompletedPengiriman(current);
    }

    const updated = await pengirimanProductRepository.updatePengirimanProduct(id, data);
    return updated;
  }

  async reverseCompletedPengiriman(pengiriman: any) {
    const materialId = pengiriman.contractItem.materialId;
    const beratNetto = pengiriman.beratNetto;
    const companyId = pengiriman.companyId;

    // Reverse stock material
    await materialRepository.updateStockMaterial(
      companyId,
      materialId,
      beratNetto,
      {
        referensi: pengiriman.nomorPengiriman,
        keterangan: `Pembatalan pengiriman ${pengiriman.nomorPengiriman}`,
        operator: pengiriman.operatorPenimbang,
      }
    );

    // Reverse contract item deliveredQuantity (kurangi yang sudah dikirim)
    const contractItem = await db.contractItem.findUnique({
      where: { id: pengiriman.contractItemId },
    });

    if (contractItem) {
      const newDeliveredQuantity = Math.max(0, contractItem.deliveredQuantity - beratNetto);
      await db.contractItem.update({
        where: { id: pengiriman.contractItemId },
        data: {
          deliveredQuantity: newDeliveredQuantity,
        },
      });
    }

    // Reverse contract status if needed (kembali ke ACTIVE karena ada pengiriman yang dibatalkan)
    await db.contract.update({
      where: { id: pengiriman.contractId },
      data: {
        status: "ACTIVE",
      },
    });
  }

  async deletePengirimanProduct(id: string) {
    const pengiriman = await pengirimanProductRepository.getPengirimanProductById(id);
    
    if (!pengiriman) {
      throw new Error("Pengiriman product tidak ditemukan");
    }

    // If it was completed, reverse the stock changes first
    if (pengiriman.status === "COMPLETED") {
      await this.reverseCompletedPengiriman(pengiriman);
    }

    return pengirimanProductRepository.deletePengirimanProduct(id);
  }

  async getStatistics(companyId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    return pengirimanProductRepository.getStatistics(companyId, filters);
  }
}

export const pengirimanProductService = new PengirimanProductService();
