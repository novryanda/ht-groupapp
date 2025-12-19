"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const bulanOptions = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

const currentYear = new Date().getFullYear();
const tahunOptions = Array.from({ length: 7 }, (_, i) => ({
  value: String(currentYear - 5 + i),
  label: String(currentYear - 5 + i),
}));

type GeneratePenggajianDialogProps = {
  onSuccess: () => void;
};

export function GeneratePenggajianDialog({
  onSuccess,
}: GeneratePenggajianDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [periodeBulan, setPeriodeBulan] = useState<string>("");
  const [periodeTahun, setPeriodeTahun] = useState<string>(String(currentYear));
  const [syncBulan, setSyncBulan] = useState<string>("");
  const [syncTahun, setSyncTahun] = useState<string>(String(currentYear));
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleGenerate = async () => {
    if (!periodeBulan || !periodeTahun) {
      setMessage({ type: "error", text: "Pilih periode bulan dan tahun" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/pt-pks/penggajian/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodeBulan, periodeTahun }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate");
      }

      setMessage({ type: "success", text: result.message });
      onSuccess();
      
      // Close dialog after success
      setTimeout(() => {
        setOpen(false);
        setMessage(null);
      }, 2000);
    } catch (error) {
      console.error("Error generating:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Gagal generate penggajian",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!syncBulan || !syncTahun) {
      setMessage({ type: "error", text: "Pilih periode untuk sinkronisasi" });
      return;
    }

    setSyncLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/pt-pks/master-karyawan/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodeBulan: syncBulan, periodeTahun: syncTahun }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to sync");
      }

      setMessage({
        type: "success",
        text: `Sinkronisasi berhasil: ${result.synced} karyawan ditambahkan, ${result.skipped} sudah ada`,
      });
    } catch (error) {
      console.error("Error syncing:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Gagal sinkronisasi",
      });
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Generate Penggajian
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Penggajian Bulan Baru</DialogTitle>
          <DialogDescription>
            Generate data penggajian dari master karyawan. Pastikan data master
            karyawan sudah lengkap.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sync Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium text-sm">
              1. Sinkronisasi Master Karyawan (Opsional)
            </h4>
            <p className="text-xs text-muted-foreground">
              Jika belum ada data master karyawan, sinkronisasi dari data
              penggajian sebelumnya.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Dari Bulan</Label>
                <Select value={syncBulan} onValueChange={setSyncBulan}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {bulanOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tahun</Label>
                <Select value={syncTahun} onValueChange={setSyncTahun}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {tahunOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncLoading || !syncBulan || !syncTahun}
              className="w-full"
            >
              {syncLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              <RefreshCw className="mr-2 h-3 w-3" />
              Sinkronisasi Master
            </Button>
          </div>

          {/* Generate Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">2. Generate Penggajian Baru</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Periode Bulan</Label>
                <Select value={periodeBulan} onValueChange={setPeriodeBulan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {bulanOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tahun</Label>
                <Select value={periodeTahun} onValueChange={setPeriodeTahun}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {tahunOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {message && (
            <Alert
              variant={message.type === "error" ? "destructive" : "default"}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {message.type === "error" ? "Error" : "Berhasil"}
              </AlertTitle>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading || !periodeBulan || !periodeTahun}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
