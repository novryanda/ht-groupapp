import { db } from "../db";
import type { PurchaseOrderInput, UpdatePurchaseOrderInput } from "../schema/purchase-order";
import { StatusPurchaseOrder } from "@prisma/client";

// Helper function to calculate PO totals
function calculatePOTotals(
  items: { jumlahOrder: number; hargaSatuan: number }[],
  taxPercent: number,
  discountType: string | undefined | null,
  discountPercent: number,
  discountAmount: number,
  shipping: number
) {
  const subtotal = items.reduce((sum, item) => sum + item.jumlahOrder * item.hargaSatuan, 0);
  
  // Calculate discount
  let calculatedDiscountAmount = 0;
  if (discountType === "PERCENT") {
    calculatedDiscountAmount = (subtotal * discountPercent) / 100;
  } else if (discountType === "AMOUNT") {
    calculatedDiscountAmount = discountAmount;
  }
  
  // Subtotal after discount
  const subtotalAfterDiscount = subtotal - calculatedDiscountAmount;
  
  // Calculate tax
  const taxAmount = (subtotalAfterDiscount * taxPercent) / 100;
  
  // Total amount
  const totalAmount = subtotalAfterDiscount + taxAmount + shipping;
  
  return {
    subtotal,
    taxAmount,
    calculatedDiscountAmount,
    totalAmount,
  };
}

export const purchaseOrderRepository = {
  async findAll(companyId: string, filters?: {
    status?: StatusPurchaseOrder;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { companyId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.startDate || filters?.endDate) {
      where.tanggalPO = {};
      if (filters.startDate) {
        where.tanggalPO.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.tanggalPO.lte = filters.endDate;
      }
    }

    return db.purchaseOrder.findMany({
      where,
      include: {
        purchaseRequest: true,
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
        penerimaanBarang: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string, companyId: string) {
    return db.purchaseOrder.findFirst({
      where: { id, companyId },
      include: {
        purchaseRequest: {
          include: {
            items: {
              include: {
                material: true,
              },
            },
          },
        },
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
        penerimaanBarang: {
          include: {
            items: true,
          },
        },
      },
    });
  },

  async create(companyId: string, nomorPO: string, data: PurchaseOrderInput) {
    // Calculate totals
    const itemsWithSubtotal = data.items.map(item => ({
      ...item,
      subtotal: item.jumlahOrder * item.hargaSatuan,
    }));

    const { subtotal, taxAmount, calculatedDiscountAmount, totalAmount } = calculatePOTotals(
      data.items,
      data.taxPercent ?? 0,
      data.discountType,
      data.discountPercent ?? 0,
      data.discountAmount ?? 0,
      data.shipping ?? 0
    );

    return db.purchaseOrder.create({
      data: {
        companyId,
        nomorPO,
        purchaseRequestId: data.purchaseRequestId,
        vendorName: data.vendorName,
        vendorAddress: data.vendorAddress,
        vendorPhone: data.vendorPhone,
        tanggalKirimDiharapkan: data.tanggalKirimDiharapkan ? new Date(data.tanggalKirimDiharapkan) : undefined,
        termPembayaran: data.termPembayaran,
        issuedBy: data.issuedBy,
        subtotal,
        taxPercent: data.taxPercent ?? 0,
        taxAmount,
        discountType: data.discountType,
        discountPercent: data.discountPercent ?? 0,
        discountAmount: calculatedDiscountAmount,
        shipping: data.shipping ?? 0,
        totalAmount,
        keterangan: data.keterangan,
        items: {
          create: itemsWithSubtotal,
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
  },

  async update(id: string, companyId: string, data: UpdatePurchaseOrderInput) {
    const updateData: any = {};
    
    if (data.vendorName) updateData.vendorName = data.vendorName;
    if (data.vendorAddress !== undefined) updateData.vendorAddress = data.vendorAddress;
    if (data.vendorPhone !== undefined) updateData.vendorPhone = data.vendorPhone;
    if (data.tanggalKirimDiharapkan) updateData.tanggalKirimDiharapkan = new Date(data.tanggalKirimDiharapkan);
    if (data.termPembayaran !== undefined) updateData.termPembayaran = data.termPembayaran;
    if (data.keterangan !== undefined) updateData.keterangan = data.keterangan;

    // If items are provided, recalculate totals
    if (data.items) {
      await db.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: id },
      });

      const itemsWithSubtotal = data.items.map(item => ({
        ...item,
        subtotal: item.jumlahOrder * item.hargaSatuan,
      }));

      const taxPercent = data.taxPercent ?? 0;
      const discountType = data.discountType;
      const discountPercent = data.discountPercent ?? 0;
      const discountAmount = data.discountAmount ?? 0;
      const shipping = data.shipping ?? 0;

      const { subtotal, taxAmount, calculatedDiscountAmount, totalAmount } = calculatePOTotals(
        data.items,
        taxPercent,
        discountType,
        discountPercent,
        discountAmount,
        shipping
      );

      updateData.subtotal = subtotal;
      updateData.taxPercent = taxPercent;
      updateData.taxAmount = taxAmount;
      updateData.discountType = discountType;
      updateData.discountPercent = discountPercent;
      updateData.discountAmount = calculatedDiscountAmount;
      updateData.shipping = shipping;
      updateData.totalAmount = totalAmount;
      updateData.items = {
        create: itemsWithSubtotal,
      };
    } else if (data.taxPercent !== undefined || data.shipping !== undefined || data.discountType !== undefined || data.discountPercent !== undefined || data.discountAmount !== undefined) {
      const currentPO = await db.purchaseOrder.findUnique({
        where: { id },
        select: { subtotal: true, taxPercent: true, discountType: true, discountPercent: true, discountAmount: true, shipping: true },
      });

      if (currentPO) {
        const taxPercent = data.taxPercent ?? currentPO.taxPercent;
        const discountType = data.discountType ?? currentPO.discountType;
        const discountPercent = data.discountPercent ?? currentPO.discountPercent;
        const discountAmount = data.discountAmount ?? currentPO.discountAmount;
        const shipping = data.shipping ?? currentPO.shipping;
        
        // Recalculate discount
        let calculatedDiscountAmount = 0;
        if (discountType === "PERCENT") {
          calculatedDiscountAmount = (currentPO.subtotal * discountPercent) / 100;
        } else if (discountType === "AMOUNT") {
          calculatedDiscountAmount = discountAmount;
        }
        
        const subtotalAfterDiscount = currentPO.subtotal - calculatedDiscountAmount;
        const taxAmount = (subtotalAfterDiscount * taxPercent) / 100;
        const totalAmount = subtotalAfterDiscount + taxAmount + shipping;
        
        updateData.taxPercent = taxPercent;
        updateData.taxAmount = taxAmount;
        updateData.discountType = discountType;
        updateData.discountPercent = discountPercent;
        updateData.discountAmount = calculatedDiscountAmount;
        updateData.shipping = shipping;
        updateData.totalAmount = totalAmount;
      }
    }

    return db.purchaseOrder.update({
      where: { id, companyId },
      data: updateData,
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
  },

  async updateStatus(id: string, companyId: string, status: StatusPurchaseOrder, additionalData?: any) {
    return db.purchaseOrder.update({
      where: { id, companyId },
      data: {
        status,
        ...additionalData,
      },
    });
  },

  async approve(id: string, companyId: string, approvedBy: string) {
    return db.purchaseOrder.update({
      where: { id, companyId },
      data: {
        approvedBy,
        tanggalApproval: new Date(),
      },
    });
  },

  async issue(id: string, companyId: string) {
    return db.purchaseOrder.update({
      where: { id, companyId },
      data: {
        status: StatusPurchaseOrder.ISSUED,
      },
    });
  },

  async updateItemReceived(itemId: string, jumlahDiterima: number) {
    const item = await db.purchaseOrderItem.findUnique({
      where: { id: itemId },
      select: { jumlahDiterima: true },
    });

    if (!item) {
      throw new Error("PO Item tidak ditemukan");
    }

    return db.purchaseOrderItem.update({
      where: { id: itemId },
      data: {
        jumlahDiterima: item.jumlahDiterima + jumlahDiterima,
      },
    });
  },

  async checkAndUpdatePOStatus(poId: string) {
    const po = await db.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        items: true,
      },
    });

    if (!po) return;

    const allReceived = po.items.every(item => item.jumlahDiterima >= item.jumlahOrder);
    const someReceived = po.items.some(item => item.jumlahDiterima > 0);

    if (allReceived) {
      await db.purchaseOrder.update({
        where: { id: poId },
        data: { status: StatusPurchaseOrder.COMPLETED },
      });
    } else if (someReceived) {
      await db.purchaseOrder.update({
        where: { id: poId },
        data: { status: StatusPurchaseOrder.PARTIAL_RECEIVED },
      });
    }
  },

  // Update PO items and recalculate totals based on received quantities
  // This is called when penerimaan barang is completed to adjust PO to match actual received qty
  async updatePOItemsAndTotals(poId: string, receivedItems: { purchaseOrderItemId: string; jumlahDiterima: number; hargaSatuan: number }[]) {
    const po = await db.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true },
    });

    if (!po) {
      throw new Error("PO tidak ditemukan");
    }

    // Update each PO item with received quantities and recalculate subtotals
    for (const receivedItem of receivedItems) {
      if (receivedItem.purchaseOrderItemId) {
        const poItem = po.items.find(item => item.id === receivedItem.purchaseOrderItemId);
        if (poItem) {
          // Update the PO item to match received quantity
          const newJumlahOrder = receivedItem.jumlahDiterima;
          const newSubtotal = newJumlahOrder * receivedItem.hargaSatuan;
          
          await db.purchaseOrderItem.update({
            where: { id: receivedItem.purchaseOrderItemId },
            data: {
              jumlahOrder: newJumlahOrder,
              hargaSatuan: receivedItem.hargaSatuan,
              subtotal: newSubtotal,
              jumlahDiterima: newJumlahOrder,
            },
          });
        }
      }
    }

    // Recalculate PO totals
    const updatedItems = await db.purchaseOrderItem.findMany({
      where: { purchaseOrderId: poId },
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
    await db.purchaseOrder.update({
      where: { id: poId },
      data: {
        subtotal: newSubtotal,
        discountAmount: calculatedDiscountAmount,
        taxAmount,
        totalAmount,
        status: StatusPurchaseOrder.COMPLETED,
      },
    });

    return db.purchaseOrder.findUnique({
      where: { id: poId },
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
  },

  async delete(id: string, companyId: string) {
    return db.purchaseOrder.delete({
      where: { id, companyId },
    });
  },

  // Method untuk mendapatkan PR yang approved dan siap untuk dijadikan PO
  async findPendingPRsForPO(companyId: string) {
    return db.purchaseRequest.findMany({
      where: {
        companyId,
        tipePembelian: "PENGAJUAN_PO",
        status: "APPROVED",
        purchaseOrder: null, // Belum ada PO
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
      orderBy: { tanggalRequest: "desc" },
    });
  },

  async generateNomorPO(companyId: string) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    
    const prefix = `PO/${year}${month}`;
    
    const lastPO = await db.purchaseOrder.findFirst({
      where: {
        companyId,
        nomorPO: {
          startsWith: prefix,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let nextNumber = 1;
    if (lastPO) {
      const lastNumber = parseInt(lastPO.nomorPO.split("/").pop() ?? "0");
      nextNumber = lastNumber + 1;
    }

    return `${prefix}/${String(nextNumber).padStart(4, "0")}`;
  },
};
