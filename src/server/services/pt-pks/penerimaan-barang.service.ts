import { penerimaanBarangRepository } from "../../repositories/penerimaan-barang.repository";
import { purchaseOrderRepository } from "../../repositories/purchase-order.repository";
import { purchaseRequestRepository } from "../../repositories/purchase-request.repository";
import { materialInventarisRepository } from "../../repositories/material-inventaris.repository";
import { inventoryTransactionRepository } from "../../repositories/inventory-transaction.repository";
import type { PenerimaanBarangInput, UpdatePenerimaanBarangInput } from "../../schema/penerimaan-barang";
import { StatusPenerimaanBarang, StatusPurchaseOrder, StatusPurchaseRequest, TipeMovement } from "@prisma/client";
import { db } from "../../db";

export const penerimaanBarangService = {
  async getAll(companyId: string, filters?: {
    status?: StatusPenerimaanBarang;
    vendorId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return penerimaanBarangRepository.findAll(companyId, filters);
  },

  async getById(id: string, companyId: string) {
    const gr = await penerimaanBarangRepository.findById(id, companyId);
    if (!gr) {
      throw new Error("Penerimaan Barang tidak ditemukan");
    }
    return gr;
  },

  async create(companyId: string, data: PenerimaanBarangInput) {
    // Validate materials
    for (const item of data.items) {
      const material = await materialInventarisRepository.findById(item.materialId, companyId);
      if (!material) {
        throw new Error(`Material dengan ID ${item.materialId} tidak ditemukan`);
      }
    }

    // If linked to PO, validate PO
    if (data.purchaseOrderId) {
      const po = await purchaseOrderRepository.findById(data.purchaseOrderId, companyId);
      if (!po) {
        throw new Error("Purchase Order tidak ditemukan");
      }
      if (po.status !== StatusPurchaseOrder.ISSUED && po.status !== StatusPurchaseOrder.PARTIAL_RECEIVED) {
        throw new Error("Purchase Order harus sudah diterbitkan");
      }
    }

    // If linked to PR (direct purchase), validate PR
    if (data.purchaseRequestId) {
      const pr = await purchaseRequestRepository.findById(data.purchaseRequestId, companyId);
      if (!pr) {
        throw new Error("Purchase Request tidak ditemukan");
      }
      if (pr.tipePembelian !== "PEMBELIAN_LANGSUNG") {
        throw new Error("Purchase Request harus bertipe PEMBELIAN_LANGSUNG");
      }
      if (pr.status !== StatusPurchaseRequest.APPROVED) {
        throw new Error("Purchase Request harus sudah approved");
      }
    }

    // Generate nomor penerimaan
    const nomorPenerimaan = await penerimaanBarangRepository.generateNomorPenerimaan(companyId);

    return penerimaanBarangRepository.create(companyId, nomorPenerimaan, data);
  },

  async update(id: string, companyId: string, data: UpdatePenerimaanBarangInput) {
    const gr = await this.getById(id, companyId);
    if (gr.status !== StatusPenerimaanBarang.DRAFT) {
      throw new Error("Penerimaan Barang tidak dapat diubah karena sudah completed");
    }

    // Validate materials if items are provided
    if (data.items) {
      for (const item of data.items) {
        const material = await materialInventarisRepository.findById(item.materialId, companyId);
        if (!material) {
          throw new Error(`Material dengan ID ${item.materialId} tidak ditemukan`);
        }
      }
    }

    return penerimaanBarangRepository.update(id, companyId, data);
  },

  async complete(id: string, companyId: string, checkedBy: string, operator: string) {
    const gr = await this.getById(id, companyId);
    if (gr.status !== StatusPenerimaanBarang.DRAFT) {
      throw new Error("Penerimaan Barang tidak dapat dicomplete");
    }

    // Use transaction to ensure atomicity
    return db.$transaction(async (tx) => {
      // Update stock and create transactions for each item
      for (const item of gr.items) {
        // Get current stock
        const material = await tx.materialInventaris.findUnique({
          where: { id: item.materialId },
        });

        if (!material) {
          throw new Error(`Material ${item.materialId} tidak ditemukan`);
        }

        const newStock = material.stockOnHand + item.jumlahDiterima;

        // Update material stock
        await tx.materialInventaris.update({
          where: { id: item.materialId },
          data: { stockOnHand: newStock },
        });

        // Create inventory transaction
        await tx.inventoryTransaction.create({
          data: {
            companyId,
            materialId: item.materialId,
            tipeTransaksi: TipeMovement.IN,
            referensi: gr.nomorPenerimaan,
            vendorId: gr.vendorId,
            vendorName: gr.vendorName,
            jumlahMasuk: item.jumlahDiterima,
            jumlahKeluar: 0,
            stockOnHand: newStock,
            hargaSatuan: item.hargaSatuan,
            totalHarga: item.totalHarga,
            keterangan: `Penerimaan Barang dari ${gr.vendorName}`,
            operator,
          },
        });

        // Update PO item if linked
        if (item.purchaseOrderItemId) {
          const poItem = await tx.purchaseOrderItem.findUnique({
            where: { id: item.purchaseOrderItemId },
          });

          if (poItem) {
            await tx.purchaseOrderItem.update({
              where: { id: item.purchaseOrderItemId },
              data: {
                jumlahDiterima: poItem.jumlahDiterima + item.jumlahDiterima,
              },
            });
          }
        }
      }

      // Update GR status
      const updatedGR = await tx.penerimaanBarang.update({
        where: { id, companyId },
        data: {
          status: StatusPenerimaanBarang.COMPLETED,
          checkedBy,
        },
        include: {
          items: {
            include: {
              material: {
                include: {
                  kategoriMaterial: true,
                  satuanMaterial: true,
                },
              },
            },
          },
        },
      });

      // Update PO status if all items received
      if (gr.purchaseOrderId) {
        const po = await tx.purchaseOrder.findUnique({
          where: { id: gr.purchaseOrderId },
          include: { items: true },
        });

        if (po) {
          // Update PO items to match received quantities and recalculate totals
          // This ensures PO reflects actual received amounts (no partial receiving)
          for (const grItem of gr.items) {
            if (grItem.purchaseOrderItemId) {
              const newSubtotal = grItem.jumlahDiterima * grItem.hargaSatuan;
              
              await tx.purchaseOrderItem.update({
                where: { id: grItem.purchaseOrderItemId },
                data: {
                  jumlahOrder: grItem.jumlahDiterima,
                  hargaSatuan: grItem.hargaSatuan,
                  subtotal: newSubtotal,
                  jumlahDiterima: grItem.jumlahDiterima,
                },
              });
            }
          }

          // Recalculate PO totals
          const updatedItems = await tx.purchaseOrderItem.findMany({
            where: { purchaseOrderId: gr.purchaseOrderId },
          });

          const newSubtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
          
          // Recalculate discount
          let calculatedDiscountAmount = 0;
          if (po.discountType === "PERCENT") {
            calculatedDiscountAmount = (newSubtotal * po.discountPercent) / 100;
          } else if (po.discountType === "AMOUNT") {
            calculatedDiscountAmount = po.discountAmount;
          }
          
          const subtotalAfterDiscount = newSubtotal - calculatedDiscountAmount;
          const taxAmount = (subtotalAfterDiscount * po.taxPercent) / 100;
          const totalAmount = subtotalAfterDiscount + taxAmount + po.shipping;

          // Update PO with new totals and COMPLETED status
          await tx.purchaseOrder.update({
            where: { id: gr.purchaseOrderId },
            data: {
              subtotal: newSubtotal,
              discountAmount: calculatedDiscountAmount,
              taxAmount,
              totalAmount,
              status: StatusPurchaseOrder.COMPLETED,
            },
          });
        }
      }

      // Update PR status if linked (for direct purchase)
      if (gr.purchaseRequestId) {
        await tx.purchaseRequest.update({
          where: { id: gr.purchaseRequestId },
          data: { status: StatusPurchaseRequest.COMPLETED },
        });
      }

      return updatedGR;
    });
  },

  async delete(id: string, companyId: string) {
    const gr = await this.getById(id, companyId);
    if (gr.status !== StatusPenerimaanBarang.DRAFT) {
      throw new Error("Hanya Penerimaan Barang dengan status DRAFT yang dapat dihapus");
    }

    return penerimaanBarangRepository.delete(id, companyId);
  },

  // Create and complete penerimaan barang from PO in one step
  async createAndCompleteFromPO(
    companyId: string,
    data: PenerimaanBarangInput,
    operator: string
  ) {
    // Validate PO
    if (!data.purchaseOrderId) {
      throw new Error("Purchase Order ID wajib diisi");
    }

    const po = await purchaseOrderRepository.findById(data.purchaseOrderId, companyId);
    if (!po) {
      throw new Error("Purchase Order tidak ditemukan");
    }
    if (po.status !== StatusPurchaseOrder.ISSUED && po.status !== StatusPurchaseOrder.PARTIAL_RECEIVED) {
      throw new Error("Purchase Order harus sudah diterbitkan (ISSUED)");
    }

    // Validate materials
    for (const item of data.items) {
      const material = await materialInventarisRepository.findById(item.materialId, companyId);
      if (!material) {
        throw new Error(`Material dengan ID ${item.materialId} tidak ditemukan`);
      }
    }

    // Generate nomor penerimaan
    const nomorPenerimaan = await penerimaanBarangRepository.generateNomorPenerimaan(companyId);

    // Use transaction to ensure atomicity
    return db.$transaction(async (tx) => {
      // Create penerimaan barang with COMPLETED status
      const penerimaanBarang = await tx.penerimaanBarang.create({
        data: {
          companyId,
          nomorPenerimaan,
          purchaseOrderId: data.purchaseOrderId,
          vendorId: data.vendorId,
          vendorName: data.vendorName,
          tanggalPenerimaan: new Date(),
          nomorSuratJalan: data.nomorSuratJalan,
          tanggalSuratJalan: data.tanggalSuratJalan ? new Date(data.tanggalSuratJalan) : undefined,
          nomorInvoice: data.nomorInvoice,
          tanggalInvoice: data.tanggalInvoice ? new Date(data.tanggalInvoice) : undefined,
          receivedBy: data.receivedBy,
          checkedBy: operator,
          keterangan: data.keterangan,
          status: StatusPenerimaanBarang.COMPLETED,
          items: {
            create: data.items.map(item => ({
              materialId: item.materialId,
              purchaseOrderItemId: item.purchaseOrderItemId,
              jumlahDiterima: item.jumlahDiterima,
              hargaSatuan: item.hargaSatuan,
              totalHarga: item.jumlahDiterima * item.hargaSatuan,
              lokasiPenyimpanan: item.lokasiPenyimpanan,
              keterangan: item.keterangan,
            })),
          },
        },
        include: {
          items: {
            include: {
              material: {
                include: {
                  kategoriMaterial: true,
                  satuanMaterial: true,
                },
              },
            },
          },
        },
      });

      // Update stock and create inventory transactions for each item
      for (const item of data.items) {
        // Get current stock
        const material = await tx.materialInventaris.findUnique({
          where: { id: item.materialId },
        });

        if (!material) {
          throw new Error(`Material ${item.materialId} tidak ditemukan`);
        }

        const newStock = material.stockOnHand + item.jumlahDiterima;

        // Update material stock
        await tx.materialInventaris.update({
          where: { id: item.materialId },
          data: { stockOnHand: newStock },
        });

        // Create inventory transaction
        await tx.inventoryTransaction.create({
          data: {
            companyId,
            materialId: item.materialId,
            tipeTransaksi: TipeMovement.IN,
            referensi: nomorPenerimaan,
            vendorId: data.vendorId,
            vendorName: data.vendorName,
            jumlahMasuk: item.jumlahDiterima,
            jumlahKeluar: 0,
            stockOnHand: newStock,
            hargaSatuan: item.hargaSatuan,
            totalHarga: item.jumlahDiterima * item.hargaSatuan,
            keterangan: `Penerimaan Barang dari PO ${po.nomorPO} - ${data.vendorName}`,
            operator,
          },
        });

        // Update PO item received quantity
        if (item.purchaseOrderItemId) {
          const poItem = await tx.purchaseOrderItem.findUnique({
            where: { id: item.purchaseOrderItemId },
          });

          if (poItem) {
            await tx.purchaseOrderItem.update({
              where: { id: item.purchaseOrderItemId },
              data: {
                jumlahDiterima: poItem.jumlahDiterima + item.jumlahDiterima,
              },
            });
          }
        }
      }

      // Check and update PO status
      const updatedPO = await tx.purchaseOrder.findUnique({
        where: { id: data.purchaseOrderId },
        include: { items: true },
      });

      if (updatedPO) {
        // Update PO items to match received quantities and recalculate totals
        // This ensures PO reflects actual received amounts (no partial receiving)
        for (const receivedItem of data.items) {
          if (receivedItem.purchaseOrderItemId) {
            const newSubtotal = receivedItem.jumlahDiterima * receivedItem.hargaSatuan;
            
            await tx.purchaseOrderItem.update({
              where: { id: receivedItem.purchaseOrderItemId },
              data: {
                jumlahOrder: receivedItem.jumlahDiterima,
                hargaSatuan: receivedItem.hargaSatuan,
                subtotal: newSubtotal,
                jumlahDiterima: receivedItem.jumlahDiterima,
              },
            });
          }
        }

        // Recalculate PO totals
        const updatedItems = await tx.purchaseOrderItem.findMany({
          where: { purchaseOrderId: data.purchaseOrderId },
        });

        const newSubtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
        
        // Recalculate discount
        let calculatedDiscountAmount = 0;
        if (updatedPO.discountType === "PERCENT") {
          calculatedDiscountAmount = (newSubtotal * updatedPO.discountPercent) / 100;
        } else if (updatedPO.discountType === "AMOUNT") {
          calculatedDiscountAmount = updatedPO.discountAmount;
        }
        
        const subtotalAfterDiscount = newSubtotal - calculatedDiscountAmount;
        const taxAmount = (subtotalAfterDiscount * updatedPO.taxPercent) / 100;
        const totalAmount = subtotalAfterDiscount + taxAmount + updatedPO.shipping;

        // Update PO with new totals and COMPLETED status
        await tx.purchaseOrder.update({
          where: { id: data.purchaseOrderId },
          data: {
            subtotal: newSubtotal,
            discountAmount: calculatedDiscountAmount,
            taxAmount,
            totalAmount,
            status: StatusPurchaseOrder.COMPLETED,
          },
        });
      }

      return penerimaanBarang;
    });
  },

  async createFromPR(
    companyId: string,
    purchaseRequestId: string,
    additionalData: {
      receivedBy: string;
      nomorSuratJalan?: string;
      tanggalSuratJalan?: string;
      tanggalPenerimaan?: string;
      keterangan?: string;
    }
  ) {
    // Get PR with items
    const pr = await purchaseRequestRepository.findById(purchaseRequestId, companyId);
    if (!pr) {
      throw new Error("Purchase Request tidak ditemukan");
    }

    if (pr.tipePembelian !== "PEMBELIAN_LANGSUNG") {
      throw new Error("Hanya Purchase Request dengan tipe PEMBELIAN_LANGSUNG yang dapat diproses");
    }

    if (pr.status !== StatusPurchaseRequest.APPROVED) {
      throw new Error("Purchase Request harus sudah approved");
    }

    // Validate items exist
    if (!pr.items || pr.items.length === 0) {
      throw new Error("Purchase Request tidak memiliki items");
    }

    console.log("PR Items:", JSON.stringify(pr.items, null, 2));

    // Validate all items have jumlahRequest
    for (const item of pr.items) {
      console.log(`Item ${item.materialId}: jumlahRequest = ${item.jumlahRequest}`);
      if (typeof item.jumlahRequest !== 'number' || item.jumlahRequest <= 0) {
        throw new Error(`Item material ${item.materialId} tidak memiliki jumlah request yang valid (jumlahRequest: ${item.jumlahRequest})`);
      }
    }

    // Generate nomor penerimaan
    const nomorPenerimaan = await penerimaanBarangRepository.generateNomorPenerimaan(companyId);

    // Create penerimaan barang using transaction
    return db.$transaction(async (tx) => {
      // Create penerimaan barang
      const penerimaanBarang = await tx.penerimaanBarang.create({
        data: {
          companyId,
          nomorPenerimaan,
          purchaseRequestId,
          vendorId: "vendor-pr",
          vendorName: pr.vendorNameDirect || "Vendor Direct",
          tanggalPenerimaan: additionalData.tanggalPenerimaan 
            ? new Date(additionalData.tanggalPenerimaan) 
            : new Date(),
          receivedBy: additionalData.receivedBy,
          nomorSuratJalan: additionalData.nomorSuratJalan,
          tanggalSuratJalan: additionalData.tanggalSuratJalan 
            ? new Date(additionalData.tanggalSuratJalan) 
            : undefined,
          keterangan: additionalData.keterangan,
          status: StatusPenerimaanBarang.COMPLETED,
          items: {
            create: pr.items.map((item) => ({
              materialId: item.materialId,
              jumlahDiterima: item.jumlahRequest,
              hargaSatuan: item.estimasiHarga || 0,
              totalHarga: (item.estimasiHarga || 0) * item.jumlahRequest,
              lokasiPenyimpanan: "Gudang Utama",
            })),
          },
        },
        include: {
          items: {
            include: {
              material: {
                include: {
                  kategoriMaterial: true,
                  satuanMaterial: true,
                },
              },
            },
          },
        },
      });

      // Update stock and create transactions for each item
      for (const item of pr.items) {
        const material = await tx.materialInventaris.findUnique({
          where: { id: item.materialId },
        });

        if (!material) {
          throw new Error(`Material ${item.materialId} tidak ditemukan`);
        }

        const newStock = material.stockOnHand + item.jumlahRequest;

        // Update material stock
        await tx.materialInventaris.update({
          where: { id: item.materialId },
          data: { stockOnHand: newStock },
        });

        // Create inventory transaction
        await tx.inventoryTransaction.create({
          data: {
            companyId,
            materialId: item.materialId,
            tipeTransaksi: TipeMovement.IN,
            referensi: nomorPenerimaan,
            vendorId: "vendor-pr",
            vendorName: pr.vendorNameDirect || "Vendor Direct",
            jumlahMasuk: item.jumlahRequest,
            jumlahKeluar: 0,
            stockOnHand: newStock,
            hargaSatuan: item.estimasiHarga || 0,
            totalHarga: (item.estimasiHarga || 0) * item.jumlahRequest,
            keterangan: `Penerimaan Barang dari PR ${pr.nomorPR} - ${pr.vendorNameDirect}`,
            operator: additionalData.receivedBy,
          },
        });
      }

      // Update PR status to COMPLETED
      await tx.purchaseRequest.update({
        where: { id: purchaseRequestId },
        data: { status: StatusPurchaseRequest.COMPLETED },
      });

      // Calculate total nilai PR
      const totalNilaiPR = pr.items.reduce((sum, item) => {
        return sum + (item.jumlahRequest * (item.estimasiHarga || 0));
      }, 0);

      // Auto-create pembayaran PR record (mark as fully paid)
      await tx.pembayaranPR.create({
        data: {
          purchaseRequestId,
          jumlahBayar: totalNilaiPR,
          metodePembayaran: "CASH",
          nomorReferensi: nomorPenerimaan,
          keterangan: `Pembayaran otomatis untuk PR Pembelian Langsung ${pr.nomorPR}`,
          dibayarOleh: additionalData.receivedBy,
        },
      });

      return penerimaanBarang;
    });
  },
};
