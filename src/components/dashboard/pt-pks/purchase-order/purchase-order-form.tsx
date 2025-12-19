"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Material {
  id: string;
  partNumber: string;
  namaMaterial: string;
  satuanMaterial: {
    symbol: string;
  };
}

interface POItem {
  materialId: string;
  jumlahOrder: number;
  hargaSatuan: number;
  keterangan?: string;
}

export function PurchaseOrderForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);

  const [formData, setFormData] = useState({
    tanggalPO: new Date().toISOString().split("T")[0],
    vendorName: "",
    vendorPhone: "",
    vendorAddress: "",
    termPembayaran: "",
    tanggalKirimDiharapkan: new Date().toISOString().split("T")[0],
    issuedBy: "",
    taxPercent: 0,
    discountType: "" as "" | "PERCENT" | "AMOUNT",
    discountPercent: 0,
    discountAmount: 0,
    shipping: 0,
    keterangan: "",
  });

  const [items, setItems] = useState<POItem[]>([
    {
      materialId: "",
      jumlahOrder: 0,
      hargaSatuan: 0,
      keterangan: "",
    },
  ]);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/pt-pks/material-inventaris");
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        materialId: "",
        jumlahOrder: 0,
        hargaSatuan: 0,
        keterangan: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const newItems = [...items];
    const {
      materialId = "",
      jumlahOrder = 0,
      hargaSatuan = 0,
      keterangan = "",
      ...rest
    } = newItems[index] || {};
    newItems[index] = {
      materialId,
      jumlahOrder,
      hargaSatuan,
      keterangan,
      ...rest,
      [field]: (field === "materialId" || field === "keterangan") ? (typeof value === "undefined" ? "" : value) : (field === "jumlahOrder" || field === "hargaSatuan" ? (typeof value === "number" ? value : 0) : value),
    };
    setItems(newItems);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.jumlahOrder * item.hargaSatuan,
    0
  );

  // Calculate discount
  const calculatedDiscountAmount = formData.discountType === "PERCENT"
    ? (subtotal * formData.discountPercent) / 100
    : formData.discountType === "AMOUNT"
    ? formData.discountAmount
    : 0;

  // Subtotal after discount
  const subtotalAfterDiscount = subtotal - calculatedDiscountAmount;

  // Calculate tax
  const taxAmount = (subtotalAfterDiscount * formData.taxPercent) / 100;

  // Total nilai
  const totalNilai = subtotalAfterDiscount + taxAmount + Number(formData.shipping);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vendorName || !formData.issuedBy) {
      toast.error("Nama vendor dan issued by wajib diisi");
      return;
    }

    if (items.length === 0 || items.some((item) => !item.materialId)) {
      toast.error("Minimal 1 item material harus diisi");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/pt-pks/purchase-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName: formData.vendorName,
          vendorPhone: formData.vendorPhone,
          vendorAddress: formData.vendorAddress,
          termPembayaran: formData.termPembayaran,
          tanggalKirimDiharapkan: formData.tanggalKirimDiharapkan,
          issuedBy: formData.issuedBy,
          taxPercent: Number(formData.taxPercent),
          discountType: formData.discountType || undefined,
          discountPercent: Number(formData.discountPercent),
          discountAmount: Number(formData.discountAmount),
          shipping: Number(formData.shipping),
          keterangan: formData.keterangan,
          items: items.map((item) => ({
            materialId: item.materialId,
            jumlahOrder: Number(item.jumlahOrder),
            hargaSatuan: Number(item.hargaSatuan),
            keterangan: item.keterangan || undefined,
          })),
        }),
      });

      if (response.ok) {
        toast.success("Purchase Order berhasil dibuat");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal membuat Purchase Order");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buat Purchase Order Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tanggalPO">Tanggal PO *</Label>
              <Input
                id="tanggalPO"
                type="date"
                value={formData.tanggalPO}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalPO: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggalKirimDiharapkan">Tanggal Pengiriman Diharapkan</Label>
              <Input
                id="tanggalKirimDiharapkan"
                type="date"
                value={formData.tanggalKirimDiharapkan}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tanggalKirimDiharapkan: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issuedBy">Diterbitkan Oleh *</Label>
              <Input
                id="issuedBy"
                value={formData.issuedBy}
                onChange={(e) =>
                  setFormData({ ...formData, issuedBy: e.target.value })
                }
                placeholder="Nama penerbit PO"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorName">Nama Vendor *</Label>
              <Input
                id="vendorName"
                value={formData.vendorName}
                onChange={(e) =>
                  setFormData({ ...formData, vendorName: e.target.value })
                }
                placeholder="Masukkan nama vendor"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorPhone">Telepon Vendor</Label>
              <Input
                id="vendorPhone"
                value={formData.vendorPhone}
                onChange={(e) =>
                  setFormData({ ...formData, vendorPhone: e.target.value })
                }
                placeholder="08xx-xxxx-xxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorAddress">Alamat Vendor</Label>
              <Textarea
                id="vendorAddress"
                value={formData.vendorAddress}
                onChange={(e) =>
                  setFormData({ ...formData, vendorAddress: e.target.value })
                }
                placeholder="Alamat lengkap vendor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="termPembayaran">Term Pembayaran</Label>
              <Input
                id="termPembayaran"
                value={formData.termPembayaran}
                onChange={(e) =>
                  setFormData({ ...formData, termPembayaran: e.target.value })
                }
                placeholder="Net 30, Net 60, dll"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxPercent">PPN (%)</Label>
              <Input
                id="taxPercent"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.taxPercent}
                onChange={(e) =>
                  setFormData({ ...formData, taxPercent: Number(e.target.value) })
                }
                placeholder="11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountType">Tipe Diskon</Label>
              <Select
                value={formData.discountType}
                onValueChange={(value) =>
                  setFormData({ 
                    ...formData, 
                    discountType: value as "" | "PERCENT" | "AMOUNT",
                    discountPercent: 0,
                    discountAmount: 0,
                  })
                }
              >
                <SelectTrigger id="discountType">
                  <SelectValue placeholder="Pilih tipe diskon (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Diskon</SelectItem>
                  <SelectItem value="PERCENT">Diskon Persen (%)</SelectItem>
                  <SelectItem value="AMOUNT">Diskon Nominal (Rp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.discountType === "PERCENT" && (
              <div className="space-y-2">
                <Label htmlFor="discountPercent">Diskon (%)</Label>
                <Input
                  id="discountPercent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discountPercent}
                  onChange={(e) =>
                    setFormData({ ...formData, discountPercent: Number(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>
            )}
            {formData.discountType === "AMOUNT" && (
              <div className="space-y-2">
                <Label htmlFor="discountAmount">Diskon (Rp)</Label>
                <Input
                  id="discountAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, discountAmount: Number(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="shipping">Biaya Kirim (Rp)</Label>
              <Input
                id="shipping"
                type="number"
                step="0.01"
                value={formData.shipping}
                onChange={(e) =>
                  setFormData({ ...formData, shipping: Number(e.target.value) })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                value={formData.keterangan}
                onChange={(e) =>
                  setFormData({ ...formData, keterangan: e.target.value })
                }
                placeholder="Keterangan tambahan"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Daftar Material</Label>
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Item
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Material</TableHead>
                    <TableHead className="w-[120px]">Jumlah</TableHead>
                    <TableHead className="w-[150px]">Harga Satuan</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="w-[80px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const selectedMaterial = materials.find(
                      (m) => m.id === item.materialId
                    );
                    const itemTotal = item.jumlahOrder * item.hargaSatuan;
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.materialId}
                            onValueChange={(value) =>
                              updateItem(index, "materialId", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih material" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map((material) => (
                                <SelectItem key={material.id} value={material.id}>
                                  {material.partNumber} - {material.namaMaterial}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.jumlahOrder}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "jumlahOrder",
                                Number(e.target.value)
                              )
                            }
                            min="0"
                            step="0.01"
                          />
                          {selectedMaterial && (
                            <span className="text-xs text-muted-foreground">
                              {selectedMaterial.satuanMaterial.symbol}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.hargaSatuan}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "hargaSatuan",
                                Number(e.target.value)
                              )
                            }
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          Rp {itemTotal.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.keterangan || ""}
                            onChange={(e) =>
                              updateItem(index, "keterangan", e.target.value)
                            }
                            placeholder="Keterangan"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">
                      Subtotal:
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      Rp {subtotal.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                  {calculatedDiscountAmount > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right text-green-600">
                        Diskon {formData.discountType === "PERCENT" ? `(${formData.discountPercent}%)` : ""}:
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        - Rp {calculatedDiscountAmount.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  )}
                  {formData.taxPercent > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">
                        PPN ({formData.taxPercent}%):
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {taxAmount.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  )}
                  {Number(formData.shipping) > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">
                        Biaya Kirim:
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {Number(formData.shipping).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">
                      Total Nilai PO:
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      Rp {totalNilai.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan PO"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
