"use client";

import { useState } from "react";
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
import { ArrowLeft, CheckCircle, XCircle, Send, FileDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const handlePrintPDF = async (id: string, nomorPR: string) => {
  try {
    const response = await fetch(`/api/pt-pks/purchase-request/${id}/pdf`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PR-${nomorPR}.pdf`;
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

interface PurchaseRequest {
  id: string;
  nomorPR: string;
  tanggalRequest: string;
  tipePembelian: string;
  divisi?: string;
  requestedBy: string;
  approvedBy?: string;
  tanggalApproval?: string;
  vendorNameDirect?: string;
  vendorAddressDirect?: string;
  vendorPhoneDirect?: string;
  status: string;
  keterangan?: string;
  items: Array<{
    id: string;
    jumlahRequest: number;
    estimasiHarga: number;
    keterangan?: string;
    material: {
      partNumber: string;
      namaMaterial: string;
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
}

interface PurchaseRequestDetailProps {
  purchaseRequest: PurchaseRequest;
  onClose: () => void;
  onSuccess: () => void;
}

export function PurchaseRequestDetail({
  purchaseRequest,
  onClose,
  onSuccess,
}: PurchaseRequestDetailProps) {
  const [loading, setLoading] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approverName, setApproverName] = useState("");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: "secondary",
      PENDING: "default",
      APPROVED: "default",
      COMPLETED: "default",
      REJECTED: "destructive",
      CANCELLED: "secondary",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const totalEstimasi = purchaseRequest.items.reduce(
    (sum, item) => sum + item.estimasiHarga * item.jumlahRequest,
    0
  );

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/pt-pks/purchase-request/${purchaseRequest.id}/submit`,
        { method: "POST" }
      );

      if (response.ok) {
        toast.success("Purchase Request berhasil disubmit untuk approval");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal submit Purchase Request");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approverName.trim()) {
      toast.error("Nama approver wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/pt-pks/purchase-request/${purchaseRequest.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approvedBy: approverName }),
        }
      );

      if (response.ok) {
        toast.success("Purchase Request berhasil diapprove");
        setShowApprovalDialog(false);
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal approve Purchase Request");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Apakah Anda yakin ingin menolak Purchase Request ini?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/pt-pks/purchase-request/${purchaseRequest.id}/reject`,
        { method: "POST" }
      );

      if (response.ok) {
        toast.success("Purchase Request berhasil ditolak");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal reject Purchase Request");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detail Purchase Request</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {purchaseRequest.nomorPR}
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Tanggal Request</Label>
              <p className="font-medium">
                {format(new Date(purchaseRequest.tanggalRequest), "dd MMMM yyyy")}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">{getStatusBadge(purchaseRequest.status)}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Tipe Pembelian</Label>
              <div className="mt-1">
                <Badge variant={purchaseRequest.tipePembelian === "PEMBELIAN_LANGSUNG" ? "default" : "outline"}>
                  {purchaseRequest.tipePembelian === "PEMBELIAN_LANGSUNG" ? "Pembelian Langsung" : "Pengajuan PO"}
                </Badge>
              </div>
            </div>
            {purchaseRequest.divisi && (
              <div>
                <Label className="text-muted-foreground">Divisi</Label>
                <p className="font-medium">{purchaseRequest.divisi}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Pemohon</Label>
              <p className="font-medium">{purchaseRequest.requestedBy}</p>
            </div>
            
            {/* Vendor information for direct purchase */}
            {purchaseRequest.tipePembelian === "PEMBELIAN_LANGSUNG" && purchaseRequest.vendorNameDirect && (
              <>
                <div>
                  <Label className="text-muted-foreground">Vendor</Label>
                  <p className="font-medium">{purchaseRequest.vendorNameDirect}</p>
                </div>
                {purchaseRequest.vendorPhoneDirect && (
                  <div>
                    <Label className="text-muted-foreground">Telepon Vendor</Label>
                    <p className="font-medium">{purchaseRequest.vendorPhoneDirect}</p>
                  </div>
                )}
                {purchaseRequest.vendorAddressDirect && (
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Alamat Vendor</Label>
                    <p className="font-medium">{purchaseRequest.vendorAddressDirect}</p>
                  </div>
                )}
              </>
            )}
            
            {purchaseRequest.approvedBy && (
              <>
                <div>
                  <Label className="text-muted-foreground">Approver</Label>
                  <p className="font-medium">{purchaseRequest.approvedBy}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tanggal Approval</Label>
                  <p className="font-medium">
                    {purchaseRequest.tanggalApproval
                      ? format(
                          new Date(purchaseRequest.tanggalApproval),
                          "dd MMMM yyyy"
                        )
                      : "-"}
                  </p>
                </div>
              </>
            )}
            {purchaseRequest.keterangan && (
              <div className="md:col-span-2">
                <Label className="text-muted-foreground">Keterangan</Label>
                <p className="font-medium">{purchaseRequest.keterangan}</p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div>
            <Label className="text-lg font-semibold">Daftar Material</Label>
            <div className="mt-2 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Nama Material</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Estimasi Harga</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseRequest.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.material.partNumber}
                      </TableCell>
                      <TableCell>{item.material.namaMaterial}</TableCell>
                      <TableCell className="text-right">
                        {item.jumlahRequest} {item.material.satuanMaterial.symbol}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {item.estimasiHarga.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp{" "}
                        {(item.estimasiHarga * item.jumlahRequest).toLocaleString(
                          "id-ID"
                        )}
                      </TableCell>
                      <TableCell>{item.keterangan || "-"}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-bold">
                      Total Estimasi:
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      Rp {totalEstimasi.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => handlePrintPDF(purchaseRequest.id, purchaseRequest.nomorPR)}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Cetak PDF
            </Button>
            <div className="flex gap-2">
              {purchaseRequest.status === "DRAFT" && (
                <Button onClick={handleSubmit} disabled={loading}>
                  <Send className="mr-2 h-4 w-4" />
                  Submit untuk Approval
                </Button>
              )}

              {purchaseRequest.status === "PENDING" && (
                <>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={loading}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Tolak
                  </Button>
                  <Button
                    onClick={() => setShowApprovalDialog(true)}
                    disabled={loading}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Purchase Request</DialogTitle>
            <DialogDescription>
              Masukkan nama Anda sebagai approver untuk Purchase Request ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approver">Nama Approver *</Label>
              <Input
                id="approver"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                placeholder="Masukkan nama Anda"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
            >
              Batal
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? "Processing..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
