"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Package, FileDown, Truck } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

interface PenerimaanBarang {
  id: string;
  nomorPenerimaan: string;
  tanggalPenerimaan: string;
  receivedBy: string;
  checkedBy?: string;
  status: string;
  keterangan?: string;
  vendorName?: string;
  purchaseOrder?: {
    id: string;
    nomorPO: string;
    tanggalPO: string;
    vendorName: string;
    totalAmount: number;
  };
  purchaseRequest?: {
    id: string;
    nomorPR: string;
    tanggalRequest: string;
  };
  items: Array<{
    id: string;
    jumlahOrder: number;
    jumlahDiterima: number;
    hargaSatuan: number;
    subtotal: number;
    kondisiBarang?: string;
    keterangan?: string;
    material: {
      id: string;
      partNumber: string;
      namaMaterial: string;
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
}

interface PenerimaanBarangDetailProps {
  penerimaanBarang: PenerimaanBarang;
  onClose: () => void;
  onSuccess?: () => void;
}

const handlePrintPDF = async (id: string, nomorPenerimaan: string) => {
  try {
    const response = await fetch(`/api/pt-pks/penerimaan-barang/${id}/pdf`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Penerimaan-${nomorPenerimaan}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF berhasil diunduh");
    } else {
      toast.error("Gagal mengunduh PDF");
    }
  } catch (error) {
    toast.error("Terjadi kesalahan saat mengunduh PDF");
  }
};

export function PenerimaanBarangDetail({
  penerimaanBarang,
  onClose,
  onSuccess,
}: PenerimaanBarangDetailProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      DRAFT: "secondary",
      PENDING: "outline",
      COMPLETED: "default",
    };

    const labels: Record<string, string> = {
      DRAFT: "Draft",
      PENDING: "Menunggu Verifikasi",
      COMPLETED: "Selesai",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const calculateTotal = () => {
    return penerimaanBarang.items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>Detail Penerimaan Barang</CardTitle>
            </div>
            {getStatusBadge(penerimaanBarang.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nomor Penerimaan</label>
                <p className="text-lg font-semibold font-mono">{penerimaanBarang.nomorPenerimaan}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tanggal Penerimaan</label>
                <p className="text-lg">
                  {format(new Date(penerimaanBarang.tanggalPenerimaan), "dd MMMM yyyy HH:mm", { locale: id })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Vendor/Supplier</label>
                <p className="text-lg font-semibold">
                  {penerimaanBarang.vendorName || penerimaanBarang.purchaseOrder?.vendorName || "-"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Diterima Oleh</label>
                <p className="text-lg">{penerimaanBarang.receivedBy}</p>
              </div>
              {penerimaanBarang.checkedBy && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Diperiksa Oleh</label>
                  <p className="text-lg">{penerimaanBarang.checkedBy}</p>
                </div>
              )}
            </div>
          </div>

          {/* PO Reference */}
          {penerimaanBarang.purchaseOrder && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-800">Referensi Purchase Order</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-purple-600">No. PO</label>
                  <p className="font-mono font-semibold">{penerimaanBarang.purchaseOrder.nomorPO}</p>
                </div>
                <div>
                  <label className="text-sm text-purple-600">Tanggal PO</label>
                  <p>
                    {format(new Date(penerimaanBarang.purchaseOrder.tanggalPO), "dd MMM yyyy", { locale: id })}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-purple-600">Total PO</label>
                  <p className="font-semibold">
                    Rp {penerimaanBarang.purchaseOrder.totalAmount.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PR Reference */}
          {penerimaanBarang.purchaseRequest && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Referensi Purchase Request</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-green-600">No. PR</label>
                  <p className="font-mono font-semibold">{penerimaanBarang.purchaseRequest.nomorPR}</p>
                </div>
                <div>
                  <label className="text-sm text-green-600">Tanggal Request</label>
                  <p>
                    {format(new Date(penerimaanBarang.purchaseRequest.tanggalRequest), "dd MMM yyyy", { locale: id })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {penerimaanBarang.keterangan && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Keterangan</label>
              <p className="text-base mt-1">{penerimaanBarang.keterangan}</p>
            </div>
          )}

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Detail Material</h3>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Nama Material</TableHead>
                    <TableHead className="text-right">Order</TableHead>
                    <TableHead className="text-right">Diterima</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead>Kondisi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {penerimaanBarang.items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{item.material.partNumber}</TableCell>
                      <TableCell className="font-medium">{item.material.namaMaterial}</TableCell>
                      <TableCell className="text-right">
                        {item.jumlahOrder.toLocaleString("id-ID")} {item.material.satuanMaterial.symbol}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.jumlahDiterima.toLocaleString("id-ID")} {item.material.satuanMaterial.symbol}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {item.hargaSatuan.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        Rp {item.subtotal.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.kondisiBarang === "BAIK" ? "default" : "secondary"}>
                          {item.kondisiBarang || "BAIK"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Total Nilai Penerimaan</p>
              <p className="text-3xl font-bold">Rp {calculateTotal().toLocaleString("id-ID")}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Item</p>
              <p className="text-2xl font-semibold">{penerimaanBarang.items.length} item</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => handlePrintPDF(penerimaanBarang.id, penerimaanBarang.nomorPenerimaan)}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Cetak PDF
            </Button>
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
