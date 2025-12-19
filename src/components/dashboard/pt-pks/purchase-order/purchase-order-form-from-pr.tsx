"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Trash2, ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";

interface Material {
  id: string;
  partNumber: string;
  namaMaterial: string;
  hargaSatuan?: number;
  satuanMaterial: {
    symbol: string;
  };
}

interface PurchaseRequestItem {
  id: string;
  jumlahRequest: number;
  estimasiHarga: number;
  keterangan?: string;
  material: Material;
}

interface PurchaseRequest {
  id: string;
  nomorPR: string;
  tanggalRequest: string;
  tipePembelian: string;
  divisi?: string;
  requestedBy: string;
  status: string;
  keterangan?: string;
  items: PurchaseRequestItem[];
}

interface POItem {
  materialId: string;
  jumlahOrder: number;
  hargaSatuan: number;
  keterangan?: string;
}

interface PurchaseOrderFormFromPRProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export function PurchaseOrderFormFromPR({ onSuccess, onBack }: PurchaseOrderFormFromPRProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingPRs, setLoadingPRs] = useState(true);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [pendingPRs, setPendingPRs] = useState<PurchaseRequest[]>([]);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);

  const [formData, setFormData] = useState({
    purchaseRequestId: "",
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

  const [items, setItems] = useState<POItem[]>([]);

  useEffect(() => {
    fetchPendingPRs();
    fetchMaterials();
  }, []);

  const fetchPendingPRs = async () => {
    setLoadingPRs(true);
    try {
      const response = await fetch("/api/pt-pks/purchase-order/pending-prs");
      if (response.ok) {
        const data = await response.json();
        setPendingPRs(data);
      }
    } catch (error) {
      console.error("Error fetching pending PRs:", error);
    } finally {
      setLoadingPRs(false);
    }
  };

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

  const handlePRSelect = (prId: string) => {
    const pr = pendingPRs.find((p) => p.id === prId);
    setSelectedPR(pr || null);
    setFormData({ ...formData, purchaseRequestId: prId });

    if (pr) {
      // Auto-populate items from PR
      const prItems: POItem[] = pr.items.map((item) => ({
        materialId: item.material.id,
        jumlahOrder: item.jumlahRequest,
        hargaSatuan: item.estimasiHarga || item.material.hargaSatuan || 0,
        keterangan: item.keterangan || "",
      }));
      setItems(prItems);
    } else {
      setItems([]);
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
    const currentItem = newItems[index];
    if (currentItem) {
      newItems[index] = {
        ...currentItem,
        [field]: value,
      };
      setItems(newItems);
    }
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
      toast.error("Nama vendor dan diterbitkan oleh wajib diisi");
      return;
    }

    if (items.length === 0 || items.some((item) => !item.materialId)) {
      toast.error("Minimal 1 item material harus diisi dengan lengkap");
      return;
    }

    if (items.some((item) => item.jumlahOrder <= 0)) {
      toast.error("Jumlah order harus lebih dari 0");
      return;
    }

    if (items.some((item) => item.hargaSatuan <= 0)) {
      toast.error("Harga satuan harus lebih dari 0");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/pt-pks/purchase-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseRequestId: formData.purchaseRequestId || undefined,
          vendorName: formData.vendorName,
          vendorPhone: formData.vendorPhone || undefined,
          vendorAddress: formData.vendorAddress || undefined,
          termPembayaran: formData.termPembayaran || undefined,
          tanggalKirimDiharapkan: formData.tanggalKirimDiharapkan || undefined,
          issuedBy: formData.issuedBy,
          taxPercent: Number(formData.taxPercent),
          discountType: formData.discountType || undefined,
          discountPercent: Number(formData.discountPercent),
          discountAmount: Number(formData.discountAmount),
          shipping: Number(formData.shipping),
          keterangan: formData.keterangan || undefined,
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
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard/pt-pks/gudang/purchase-order");
        }
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

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/dashboard/pt-pks/gudang/purchase-order");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Buat Purchase Order</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Buat PO baru dengan referensi dari Purchase Request yang sudah diapprove
            </p>
          </div>
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PR Reference Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <Label className="text-lg font-semibold">Referensi Purchase Request (Opsional)</Label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchaseRequestId">Pilih PR yang Sudah Diapprove</Label>
                <Select
                  value={formData.purchaseRequestId}
                  onValueChange={handlePRSelect}
                  disabled={loadingPRs}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingPRs ? "Memuat..." : "Pilih PR (opsional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa Referensi PR</SelectItem>
                    {pendingPRs.map((pr) => (
                      <SelectItem key={pr.id} value={pr.id}>
                        {pr.nomorPR} - {pr.requestedBy}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Pilih PR untuk mengisi data material secara otomatis
                </p>
              </div>
              
              {selectedPR && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Detail PR Terpilih</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nomor:</span>
                      <span className="font-medium">{selectedPR.nomorPR}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pemohon:</span>
                      <span>{selectedPR.requestedBy}</span>
                    </div>
                    {selectedPR.divisi && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Divisi:</span>
                        <span>{selectedPR.divisi}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jumlah Item:</span>
                      <Badge variant="secondary">{selectedPR.items.length} item</Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Information */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Informasi Vendor</Label>
            <div className="grid gap-4 md:grid-cols-2">
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
              <div className="space-y-2 md:col-span-2">
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
            </div>
          </div>

          {/* PO Information */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Informasi PO</Label>
            <div className="grid gap-4 md:grid-cols-2">
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
                <Label htmlFor="keterangan">Keterangan</Label>
                <Input
                  id="keterangan"
                  value={formData.keterangan}
                  onChange={(e) =>
                    setFormData({ ...formData, keterangan: e.target.value })
                  }
                  placeholder="Keterangan tambahan"
                />
              </div>
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

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">Material</TableHead>
                    <TableHead className="min-w-[120px]">Jumlah</TableHead>
                    <TableHead className="min-w-[150px]">Harga Satuan</TableHead>
                    <TableHead className="min-w-[150px] text-right">Total</TableHead>
                    <TableHead className="min-w-[150px]">Keterangan</TableHead>
                    <TableHead className="w-[80px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Belum ada item. Pilih PR untuk mengisi otomatis atau tambah item manual.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => {
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
                            <div className="flex items-center gap-2">
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
                                className="w-24"
                              />
                              {selectedMaterial && (
                                <span className="text-sm text-muted-foreground">
                                  {selectedMaterial.satuanMaterial.symbol}
                                </span>
                              )}
                            </div>
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
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
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
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            {items.length > 0 && (
              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-2 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">Rp {subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="discountType" className="text-muted-foreground">Tipe Diskon:</Label>
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
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Tanpa Diskon" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tanpa Diskon</SelectItem>
                        <SelectItem value="PERCENT">Persen (%)</SelectItem>
                        <SelectItem value="AMOUNT">Nominal (Rp)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.discountType === "PERCENT" && (
                    <div className="flex justify-between items-center">
                      <Label htmlFor="discountPercent" className="text-muted-foreground">Diskon (%):</Label>
                      <Input
                        id="discountPercent"
                        type="number"
                        value={formData.discountPercent}
                        onChange={(e) =>
                          setFormData({ ...formData, discountPercent: Number(e.target.value) })
                        }
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-32"
                      />
                    </div>
                  )}
                  {formData.discountType === "AMOUNT" && (
                    <div className="flex justify-between items-center">
                      <Label htmlFor="discountAmount" className="text-muted-foreground">Diskon (Rp):</Label>
                      <Input
                        id="discountAmount"
                        type="number"
                        value={formData.discountAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, discountAmount: Number(e.target.value) })
                        }
                        min="0"
                        step="0.01"
                        className="w-32"
                      />
                    </div>
                  )}
                  {calculatedDiscountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Potongan Diskon:</span>
                      <span className="font-medium">- Rp {calculatedDiscountAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <Label htmlFor="taxPercent" className="text-muted-foreground">PPN (%):</Label>
                    <Input
                      id="taxPercent"
                      type="number"
                      value={formData.taxPercent}
                      onChange={(e) =>
                        setFormData({ ...formData, taxPercent: Number(e.target.value) })
                      }
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-32"
                    />
                  </div>
                  {taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nilai PPN:</span>
                      <span className="font-medium">Rp {taxAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <Label htmlFor="shipping" className="text-muted-foreground">Biaya Kirim (Rp):</Label>
                    <Input
                      id="shipping"
                      type="number"
                      value={formData.shipping}
                      onChange={(e) =>
                        setFormData({ ...formData, shipping: Number(e.target.value) })
                      }
                      min="0"
                      step="0.01"
                      className="w-32"
                    />
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-bold">Total Nilai PO:</span>
                    <span className="font-bold text-lg">Rp {totalNilai.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleBack}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || items.length === 0}>
              {loading ? "Menyimpan..." : "Simpan Purchase Order"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
