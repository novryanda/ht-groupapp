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
import { ArrowLeft, Package, FileDown } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

const handlePrintPDF = async (pengeluaranId: string, nomorPengeluaran: string) => {
  try {
    const response = await fetch(`/api/pt-pks/pengeluaran-barang/${pengeluaranId}/pdf`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Pengeluaran-${nomorPengeluaran}.pdf`;
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

interface PengeluaranBarang {
  id: string;
  nomorPengeluaran: string;
  tanggalPengeluaran: string;
  divisi: string;
  requestedBy: string;
  approvedBy?: string;
  tanggalApproval?: string;
  issuedBy?: string;
  receivedByDivisi?: string;
  tanggalDiterima?: string;
  status: string;
  keterangan?: string;
  storeRequest?: {
    nomorSR: string;
    tanggalRequest: string;
  };
  items: Array<{
    id: string;
    jumlahKeluar: number;
    hargaSatuan: number;
    totalHarga: number;
    keterangan?: string;
    material: {
      namaMaterial: string;
      partNumber: string;
      kategoriMaterial: {
        nama: string;
      };
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
}

interface PengeluaranBarangDetailProps {
  pengeluaranBarang: PengeluaranBarang;
  onClose: () => void;
  onSuccess: () => void;
}

export function PengeluaranBarangDetail({
  pengeluaranBarang,
  onClose,
  onSuccess,
}: PengeluaranBarangDetailProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: "secondary",
      PENDING: "default",
      APPROVED: "default",
      COMPLETED: "default",
      REJECTED: "destructive",
      CANCELLED: "secondary",
    };

    const labels: Record<string, string> = {
      DRAFT: "Draft",
      PENDING: "Menunggu Approval",
      APPROVED: "Disetujui",
      COMPLETED: "Selesai",
      REJECTED: "Ditolak",
      CANCELLED: "Dibatalkan",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const calculateTotal = () => {
    return pengeluaranBarang.items.reduce((total, item) => total + item.totalHarga, 0);
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
              <CardTitle>Detail Pengeluaran Barang</CardTitle>
            </div>
            {getStatusBadge(pengeluaranBarang.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nomor Pengeluaran</label>
                <p className="text-lg font-semibold font-mono">{pengeluaranBarang.nomorPengeluaran}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tanggal Pengeluaran</label>
                <p className="text-lg">
                  {format(new Date(pengeluaranBarang.tanggalPengeluaran), "dd MMMM yyyy HH:mm", { locale: id })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Divisi</label>
                <p className="text-lg font-semibold">{pengeluaranBarang.divisi}</p>
              </div>
              {pengeluaranBarang.storeRequest && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nomor Store Request</label>
                  <p className="text-lg font-mono">{pengeluaranBarang.storeRequest.nomorSR}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(pengeluaranBarang.storeRequest.tanggalRequest), "dd MMM yyyy", { locale: id })}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Diminta oleh</label>
                <p className="text-lg">{pengeluaranBarang.requestedBy}</p>
              </div>
              {pengeluaranBarang.approvedBy && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Disetujui oleh</label>
                  <p className="text-lg">{pengeluaranBarang.approvedBy}</p>
                  {pengeluaranBarang.tanggalApproval && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(pengeluaranBarang.tanggalApproval), "dd MMM yyyy HH:mm", { locale: id })}
                    </p>
                  )}
                </div>
              )}
              {pengeluaranBarang.issuedBy && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dikeluarkan oleh</label>
                  <p className="text-lg">{pengeluaranBarang.issuedBy}</p>
                </div>
              )}
              {pengeluaranBarang.receivedByDivisi && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Diterima oleh</label>
                  <p className="text-lg">{pengeluaranBarang.receivedByDivisi}</p>
                  {pengeluaranBarang.tanggalDiterima && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(pengeluaranBarang.tanggalDiterima), "dd MMM yyyy HH:mm", { locale: id })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {pengeluaranBarang.keterangan && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Keterangan</label>
              <p className="text-base mt-1">{pengeluaranBarang.keterangan}</p>
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
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-right">Total Harga</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pengeluaranBarang.items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{item.material.partNumber}</TableCell>
                      <TableCell className="font-medium">{item.material.namaMaterial}</TableCell>
                      <TableCell className="text-right">
                        {item.jumlahKeluar.toLocaleString("id-ID")} {item.material.satuanMaterial.symbol}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {item.hargaSatuan.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        Rp {item.totalHarga.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.keterangan || "-"}
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
              <p className="text-sm text-muted-foreground">Total Nilai Pengeluaran</p>
              <p className="text-3xl font-bold">Rp {calculateTotal().toLocaleString("id-ID")}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Item</p>
              <p className="text-2xl font-semibold">{pengeluaranBarang.items.length} item</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => handlePrintPDF(pengeluaranBarang.id, pengeluaranBarang.nomorPengeluaran)}
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
