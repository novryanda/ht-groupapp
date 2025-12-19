"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle,
  Send,
  XCircle,
  Package,
  FileText,
  Building2,
  Calendar,
  User,
  FileDown,
  Upload,
  Trash2,
  Download,
  File,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const handlePrintPDF = async (id: string, nomorPO: string) => {
  try {
    const response = await fetch(`/api/pt-pks/purchase-order/${id}/pdf`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PO-${nomorPO}.pdf`;
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

interface PurchaseOrderItem {
  id: string;
  jumlahOrder: number;
  jumlahDiterima: number;
  hargaSatuan: number;
  subtotal: number;
  keterangan?: string;
  material: {
    id: string;
    partNumber: string;
    namaMaterial: string;
    satuanMaterial: {
      symbol: string;
    };
    kategoriMaterial: {
      namaKategori: string;
    };
  };
}

interface PurchaseRequest {
  id: string;
  nomorPR: string;
  tanggalRequest: string;
  requestedBy: string;
  divisi?: string;
}

interface PenerimaanBarang {
  id: string;
  nomorPenerimaan: string;
  tanggalPenerimaan: string;
  receivedBy: string;
  status: string;
}

interface PurchaseOrder {
  id: string;
  nomorPO: string;
  tanggalPO: string;
  vendorName: string;
  vendorAddress?: string;
  vendorPhone?: string;
  tanggalKirimDiharapkan?: string;
  termPembayaran?: string;
  issuedBy: string;
  approvedBy?: string;
  tanggalApproval?: string;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountType?: string;
  discountPercent: number;
  discountAmount: number;
  shipping: number;
  totalAmount: number;
  keterangan?: string;
  status: string;
  brosurPdfPath?: string;
  brosurPdfName?: string;
  purchaseRequest?: PurchaseRequest;
  items: PurchaseOrderItem[];
  penerimaanBarang: PenerimaanBarang[];
}

interface PurchaseOrderDetailProps {
  purchaseOrder: PurchaseOrder;
  onBack: () => void;
  onRefresh: () => void;
}

export function PurchaseOrderDetail({
  purchaseOrder,
  onBack,
  onRefresh,
}: PurchaseOrderDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approverName, setApproverName] = useState("");
  const [uploadingBrosur, setUploadingBrosur] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      DRAFT: "secondary",
      ISSUED: "default",
      PARTIAL_RECEIVED: "outline",
      COMPLETED: "default",
      CANCELLED: "destructive",
    };

    const labels: Record<string, string> = {
      DRAFT: "Draft",
      ISSUED: "Diterbitkan",
      PARTIAL_RECEIVED: "Diterima Sebagian",
      COMPLETED: "Selesai",
      CANCELLED: "Dibatalkan",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handleApprove = async () => {
    if (!approverName.trim()) {
      toast.error("Nama approver wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/pt-pks/purchase-order/${purchaseOrder.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approvedBy: approverName }),
        }
      );

      if (response.ok) {
        toast.success("Purchase Order berhasil diapprove");
        setShowApprovalDialog(false);
        onRefresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal approve Purchase Order");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!confirm("Apakah Anda yakin ingin menerbitkan Purchase Order ini?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/pt-pks/purchase-order/${purchaseOrder.id}/issue`,
        { method: "POST" }
      );

      if (response.ok) {
        toast.success("Purchase Order berhasil diterbitkan");
        onRefresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal menerbitkan Purchase Order");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Apakah Anda yakin ingin membatalkan Purchase Order ini?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/pt-pks/purchase-order/${purchaseOrder.id}/cancel`,
        { method: "POST" }
      );

      if (response.ok) {
        toast.success("Purchase Order berhasil dibatalkan");
        onRefresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal membatalkan Purchase Order");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePenerimaan = () => {
    router.push(`/dashboard/pt-pks/gudang/penerimaan-barang?poId=${purchaseOrder.id}`);
  };

  const handleUploadBrosur = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Hanya file PDF yang diizinkan");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }

    setUploadingBrosur(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/pt-pks/purchase-order/${purchaseOrder.id}/upload-brosur`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        toast.success("Brosur berhasil diupload");
        onRefresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal upload brosur");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat upload");
    } finally {
      setUploadingBrosur(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteBrosur = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus brosur ini?")) return;

    setUploadingBrosur(true);
    try {
      const response = await fetch(
        `/api/pt-pks/purchase-order/${purchaseOrder.id}/upload-brosur`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Brosur berhasil dihapus");
        onRefresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal menghapus brosur");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus");
    } finally {
      setUploadingBrosur(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {purchaseOrder.nomorPO}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Detail Purchase Order
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(purchaseOrder.status)}
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Information */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column - PO Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Informasi PO</h3>
              </div>
              <div className="grid gap-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal PO:</span>
                  <span className="font-medium">
                    {format(new Date(purchaseOrder.tanggalPO), "dd MMMM yyyy", { locale: localeId })}
                  </span>
                </div>
                {purchaseOrder.tanggalKirimDiharapkan && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tanggal Kirim Diharapkan:</span>
                    <span className="font-medium">
                      {format(new Date(purchaseOrder.tanggalKirimDiharapkan), "dd MMMM yyyy", { locale: localeId })}
                    </span>
                  </div>
                )}
                {purchaseOrder.termPembayaran && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Term Pembayaran:</span>
                    <span className="font-medium">{purchaseOrder.termPembayaran}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diterbitkan Oleh:</span>
                  <span className="font-medium">{purchaseOrder.issuedBy}</span>
                </div>
                {purchaseOrder.approvedBy && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diapprove Oleh:</span>
                    <span className="font-medium">{purchaseOrder.approvedBy}</span>
                  </div>
                )}
                {purchaseOrder.tanggalApproval && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tanggal Approval:</span>
                    <span className="font-medium">
                      {format(new Date(purchaseOrder.tanggalApproval), "dd MMMM yyyy", { locale: localeId })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Vendor Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Informasi Vendor</h3>
              </div>
              <div className="grid gap-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama Vendor:</span>
                  <span className="font-medium">{purchaseOrder.vendorName}</span>
                </div>
                {purchaseOrder.vendorPhone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telepon:</span>
                    <span className="font-medium">{purchaseOrder.vendorPhone}</span>
                  </div>
                )}
                {purchaseOrder.vendorAddress && (
                  <div>
                    <span className="text-muted-foreground">Alamat:</span>
                    <p className="font-medium mt-1">{purchaseOrder.vendorAddress}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PR Reference */}
          {purchaseOrder.purchaseRequest && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Referensi Purchase Request</h3>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nomor PR:</span>
                      <span className="font-medium">{purchaseOrder.purchaseRequest.nomorPR}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pemohon:</span>
                      <span className="font-medium">{purchaseOrder.purchaseRequest.requestedBy}</span>
                    </div>
                    {purchaseOrder.purchaseRequest.divisi && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Divisi:</span>
                        <span className="font-medium">{purchaseOrder.purchaseRequest.divisi}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tanggal Request:</span>
                      <span className="font-medium">
                        {format(new Date(purchaseOrder.purchaseRequest.tanggalRequest), "dd MMMM yyyy", { locale: localeId })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Items Table */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Daftar Material</h3>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Nama Material</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Jumlah Order</TableHead>
                    <TableHead className="text-right">Diterima</TableHead>
                    <TableHead className="text-right">Sisa</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrder.items.map((item) => {
                    const sisa = item.jumlahOrder - item.jumlahDiterima;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.material.partNumber}
                        </TableCell>
                        <TableCell>{item.material.namaMaterial}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.material.kategoriMaterial.namaKategori}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.jumlahOrder} {item.material.satuanMaterial.symbol}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.jumlahDiterima} {item.material.satuanMaterial.symbol}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={sisa > 0 ? "secondary" : "default"}>
                            {sisa} {item.material.satuanMaterial.symbol}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          Rp {item.hargaSatuan.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          Rp {item.subtotal.toLocaleString("id-ID")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">Rp {purchaseOrder.subtotal.toLocaleString("id-ID")}</span>
                </div>
                {purchaseOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon {purchaseOrder.discountType === "PERCENT" ? `(${purchaseOrder.discountPercent}%)` : ""}:</span>
                    <span className="font-medium">- Rp {purchaseOrder.discountAmount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {purchaseOrder.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PPN ({purchaseOrder.taxPercent}%):</span>
                    <span className="font-medium">Rp {purchaseOrder.taxAmount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {purchaseOrder.shipping > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Biaya Kirim:</span>
                    <span className="font-medium">Rp {purchaseOrder.shipping.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-lg">Rp {purchaseOrder.totalAmount.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Penerimaan Barang */}
          {purchaseOrder.penerimaanBarang && purchaseOrder.penerimaanBarang.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Riwayat Penerimaan Barang</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nomor Penerimaan</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Diterima Oleh</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrder.penerimaanBarang.map((penerimaan) => (
                        <TableRow key={penerimaan.id}>
                          <TableCell className="font-medium">
                            {penerimaan.nomorPenerimaan}
                          </TableCell>
                          <TableCell>
                            {format(new Date(penerimaan.tanggalPenerimaan), "dd MMMM yyyy", { locale: localeId })}
                          </TableCell>
                          <TableCell>{penerimaan.receivedBy}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{penerimaan.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}

          {/* Keterangan */}
          {purchaseOrder.keterangan && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold">Keterangan</h3>
                <p className="text-muted-foreground">{purchaseOrder.keterangan}</p>
              </div>
            </>
          )}

          {/* Brosur / Lampiran PDF */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Brosur / Lampiran PDF</h3>
              </div>
            </div>
            
            {purchaseOrder.brosurPdfPath ? (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">{purchaseOrder.brosurPdfName || "Brosur PDF"}</p>
                    <p className="text-sm text-muted-foreground">
                      Klik untuk download atau hapus file
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={purchaseOrder.brosurPdfPath} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteBrosur}
                    disabled={uploadingBrosur}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  Upload brosur atau lampiran PDF (Maks. 10MB)
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,application/pdf"
                  onChange={handleUploadBrosur}
                  className="hidden"
                  id="brosur-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingBrosur}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadingBrosur ? "Mengupload..." : "Pilih File PDF"}
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <Separator />
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => handlePrintPDF(purchaseOrder.id, purchaseOrder.nomorPO)}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Cetak PDF
            </Button>
            <div className="flex gap-2">
              {purchaseOrder.status === "DRAFT" && !purchaseOrder.approvedBy && (
                <Button
                  variant="outline"
                  onClick={() => setShowApprovalDialog(true)}
                  disabled={loading}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              )}
              {purchaseOrder.status === "DRAFT" && purchaseOrder.approvedBy && (
                <Button
                  onClick={handleIssue}
                  disabled={loading}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Terbitkan PO
                </Button>
              )}
              {purchaseOrder.status === "ISSUED" && (
                <Button
                  onClick={handleCreatePenerimaan}
                  disabled={loading}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Buat Penerimaan Barang
                </Button>
              )}
              {purchaseOrder.status !== "COMPLETED" && purchaseOrder.status !== "CANCELLED" && (
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Batalkan
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Purchase Order</DialogTitle>
            <DialogDescription>
              Masukkan nama Anda untuk menyetujui Purchase Order ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approverName">Nama Approver *</Label>
              <Input
                id="approverName"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                placeholder="Masukkan nama Anda"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? "Menyimpan..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
