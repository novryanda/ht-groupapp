"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { TransporterForm } from "./transporter-form";
import { TransporterDetail } from "./transporter-detail";

export type Transporter = {
  id: string;
  nomorKendaraan: string;
  namaSupir: string;
  telepon?: string | null;
  createdAt: string;
  supplierTransporters?: Array<{
    supplier: {
      id: string;
      ownerName: string;
    };
  }>;
};

export function TransporterList() {
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTransporter, setSelectedTransporter] = useState<Transporter | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchTransporters = async () => {
    try {
      const res = await fetch("/api/pt-pks/transporter");
      if (res.ok) {
        const data = await res.json();
        setTransporters(data);
      }
    } catch (error) {
      console.error("Error fetching transporters:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransporters();
  }, []);

  const handleAdd = () => {
    setSelectedTransporter(null);
    setShowForm(true);
  };

  const handleEdit = (transporter: Transporter) => {
    setSelectedTransporter(transporter);
    setShowForm(true);
  };

  const handleView = (transporter: Transporter) => {
    setSelectedTransporter(transporter);
    setShowDetail(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/pt-pks/transporter?id=${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchTransporters();
      }
    } catch (error) {
      console.error("Error deleting transporter:", error);
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedTransporter(null);
    fetchTransporters();
  };

  if (showForm) {
    return (
      <TransporterForm
        transporter={selectedTransporter}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setSelectedTransporter(null);
        }}
      />
    );
  }

  if (showDetail && selectedTransporter) {
    return (
      <TransporterDetail
        transporterId={selectedTransporter.id}
        onBack={() => {
          setShowDetail(false);
          setSelectedTransporter(null);
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Data Pengirim/Transporter</CardTitle>
            <CardDescription>
              Kelola data kendaraan dan supir pengirim TBS
            </CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Transporter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Kendaraan</TableHead>
                <TableHead>Nama Supir</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Supplier Terkait</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transporters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Belum ada data transporter
                  </TableCell>
                </TableRow>
              ) : (
                transporters.map((transporter) => (
                  <TableRow key={transporter.id}>
                    <TableCell className="font-medium">{transporter.nomorKendaraan}</TableCell>
                    <TableCell>{transporter.namaSupir}</TableCell>
                    <TableCell>{transporter.telepon || "-"}</TableCell>
                    <TableCell>
                      {transporter.supplierTransporters && transporter.supplierTransporters.length > 0
                        ? `${transporter.supplierTransporters.length} supplier`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(transporter)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(transporter)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog open={deleteDialogOpen && deleteId === transporter.id} onOpenChange={(open) => {
                          setDeleteDialogOpen(open);
                          if (!open) setDeleteId(null);
                        }}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeleteId(transporter.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Transporter?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus transporter ini? Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

  );
}

