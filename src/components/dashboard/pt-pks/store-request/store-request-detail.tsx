"use client";

import { useState } from "react";
import { useEffect } from "react";
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

const handlePrintPDF = async (id: string, nomorSR: string) => {
  try {
    const response = await fetch(`/api/pt-pks/store-request/${id}/pdf`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SR-${nomorSR}.pdf`;
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

interface StoreRequest {
  id: string;
  nomorSR: string;
  tanggalRequest: string;
  divisi: string;
  requestedBy: string;
  approvedBy?: string;
  tanggalApproval?: string;
  status: string;
  keterangan?: string;
  items: Array<{
    id: string;
    jumlahRequest: number;
    keterangan?: string;
    material: {
      partNumber: string;
      namaMaterial: string;
      stockOnHand: number;
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
}

interface StoreRequestDetailProps {
  storeRequest: StoreRequest;
  onClose: () => void;
  onSuccess: () => void;
}

export function StoreRequestDetail({
    storeRequest,
    onClose,
    onSuccess,
  }: StoreRequestDetailProps) {
    const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approverName, setApproverName] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState({
    divisi: storeRequest.divisi,
    requestedBy: storeRequest.requestedBy,
    keterangan: storeRequest.keterangan || "",
    items: storeRequest.items.map(item => ({
      materialId: item.material.partNumber, // fallback, will be mapped below
      jumlahRequest: item.jumlahRequest,
      keterangan: item.keterangan || ""
    }))
  });

  useEffect(() => {
    // Fetch materials for select options
    fetch("/api/pt-pks/material-inventaris")
      .then(res => res.json())
      .then(setMaterials);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: "secondary",
      PENDING: "default",
      APPROVED: "default",
      COMPLETED: "default",
      REJECTED: "destructive",
      NEED_PR: "default",
      CANCELLED: "secondary",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/pt-pks/store-request/${storeRequest.id}/submit`,
        { method: "POST" }
      );

      if (response.ok) {
        toast.success("Store Request berhasil disubmit untuk approval");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal submit Store Request");
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
        `/api/pt-pks/store-request/${storeRequest.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approvedBy: approverName }),
        }
      );

      if (response.ok) {
        toast.success("Store Request berhasil diapprove");
        setShowApprovalDialog(false);
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal approve Store Request");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Apakah Anda yakin ingin menolak Store Request ini?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/pt-pks/store-request/${storeRequest.id}/reject`,
        { method: "POST" }
      );

      if (response.ok) {
        toast.success("Store Request berhasil ditolak");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal reject Store Request");
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
              <CardTitle>Detail Store Request</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {storeRequest.nomorSR}
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
                {format(new Date(storeRequest.tanggalRequest), "dd MMMM yyyy")}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">{getStatusBadge(storeRequest.status)}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Divisi</Label>
              <p className="font-medium">{storeRequest.divisi}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Pemohon</Label>
              <p className="font-medium">{storeRequest.requestedBy}</p>
            </div>
            {storeRequest.approvedBy && (
              <>
                <div>
                  <Label className="text-muted-foreground">Approver</Label>
                  <p className="font-medium">{storeRequest.approvedBy}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tanggal Approval</Label>
                  <p className="font-medium">
                    {storeRequest.tanggalApproval
                      ? format(
                          new Date(storeRequest.tanggalApproval),
                          "dd MMMM yyyy"
                        )
                      : "-"}
                  </p>
                </div>
              </>
            )}
            {storeRequest.keterangan && (
              <div className="md:col-span-2">
                <Label className="text-muted-foreground">Keterangan</Label>
                <p className="font-medium">{storeRequest.keterangan}</p>
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
                    <TableHead className="text-right">Jumlah Request</TableHead>
                    <TableHead className="text-right">Stock Tersedia</TableHead>
                    <TableHead>Status Stock</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storeRequest.items.map((item) => {
                    const sufficient = item.material.stockOnHand >= item.jumlahRequest;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.material.partNumber}
                        </TableCell>
                        <TableCell>{item.material.namaMaterial}</TableCell>
                        <TableCell className="text-right">
                          {item.jumlahRequest} {item.material.satuanMaterial.symbol}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.material.stockOnHand} {item.material.satuanMaterial.symbol}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sufficient ? "default" : "destructive"}>
                            {sufficient ? "Tersedia" : "Tidak Cukup"}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.keterangan || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => handlePrintPDF(storeRequest.id, storeRequest.nomorSR)}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Cetak PDF
            </Button>
            <div className="flex gap-2">
              {storeRequest.status === "PENDING" && (
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
                  <Button
                    variant="outline"
                    onClick={() => setIsEditMode(true)}
                    disabled={loading}
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Inline Edit Form */}
          {isEditMode && (
            <div className="border rounded-md p-4 my-4 bg-muted">
              <h2 className="text-lg font-semibold mb-4">Edit Store Request</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Divisi</Label>
                  <Input
                    value={editData.divisi}
                    onChange={e => setEditData({ ...editData, divisi: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Pemohon</Label>
                  <Input
                    value={editData.requestedBy}
                    onChange={e => setEditData({ ...editData, requestedBy: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Keterangan</Label>
                  <Input
                    value={editData.keterangan}
                    onChange={e => setEditData({ ...editData, keterangan: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-6">
                <Label className="mb-2">Daftar Material</Label>
                <div className="rounded-md border mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editData.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <select
                              className="border rounded px-2 py-1 w-full"
                              value={item.materialId}
                              onChange={e => {
                                const newItems = [...editData.items];
                                if (newItems[idx]) {
                                  newItems[idx].materialId = e.target.value;
                                  setEditData({ ...editData, items: newItems });
                                }
                              }}
                            >
                              <option value="">Pilih material</option>
                              {materials.map(mat => (
                                <option key={mat.id} value={mat.id}>
                                  {mat.partNumber} - {mat.namaMaterial} (Stock: {mat.stockOnHand} {mat.satuanMaterial.symbol})
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              value={item.jumlahRequest}
                              onChange={e => {
                                const newItems = [...editData.items];
                                if (newItems[idx]) {
                                  newItems[idx].jumlahRequest = parseFloat(e.target.value) || 0;
                                  setEditData({ ...editData, items: newItems });
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.keterangan || ""}
                              onChange={e => {
                                const newItems = [...editData.items];
                                if (newItems[idx]) {
                                  newItems[idx].keterangan = e.target.value;
                                  setEditData({ ...editData, items: newItems });
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newItems = editData.items.filter((_, i) => i !== idx);
                                setEditData({ ...editData, items: newItems });
                              }}
                              disabled={editData.items.length === 1}
                            >
                              Hapus
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditData({ ...editData, items: [...editData.items, { materialId: "", jumlahRequest: 0, keterangan: "" }] })}
                    >
                      Tambah Item
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  Batal
                </Button>
                <Button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const response = await fetch(`/api/pt-pks/store-request/${storeRequest.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(editData),
                      });
                      if (response.ok) {
                        toast.success("Store Request berhasil diupdate");
                        setIsEditMode(false);
                        onSuccess();
                      } else {
                        const error = await response.json();
                        toast.error(error.error || "Gagal update Store Request");
                      }
                    } catch (error) {
                      toast.error("Terjadi kesalahan");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Store Request</DialogTitle>
            <DialogDescription>
              Masukkan nama Anda sebagai approver untuk Store Request ini.
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
