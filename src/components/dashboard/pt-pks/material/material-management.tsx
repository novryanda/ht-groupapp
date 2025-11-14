"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
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

type Kategori = {
  id: string;
  name: string;
  description?: string | null;
};

type Satuan = {
  id: string;
  name: string;
  symbol: string;
};

type Material = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  kategori: Kategori;
  satuan: Satuan;
};

export function MaterialManagement() {
  // State for AlertDialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<null | "kategori" | "satuan" | "material">(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("kategori");
  
  // Kategori state
  const [kategoris, setKategoris] = useState<Kategori[]>([]);
  const [showKategoriForm, setShowKategoriForm] = useState(false);
  const [selectedKategori, setSelectedKategori] = useState<Kategori | null>(null);
  const [kategoriForm, setKategoriForm] = useState({ name: "", description: "" });
  
  // Satuan state
  const [satuans, setSatuans] = useState<Satuan[]>([]);
  const [showSatuanForm, setShowSatuanForm] = useState(false);
  const [selectedSatuan, setSelectedSatuan] = useState<Satuan | null>(null);
  const [satuanForm, setSatuanForm] = useState({ name: "", symbol: "" });
  
  // Material state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [materialForm, setMaterialForm] = useState({
    name: "",
    code: "",
    description: "",
    kategoriId: "",
    satuanId: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch data
  useEffect(() => {
    fetchKategoris();
    fetchSatuans();
    fetchMaterials();
  }, []);

  const fetchKategoris = async () => {
    try {
      const res = await fetch("/api/pt-pks/kategori-material");
      if (res.ok) {
        const data = await res.json();
        setKategoris(data);
      }
    } catch (error) {
      console.error("Error fetching kategoris:", error);
    }
  };

  const fetchSatuans = async () => {
    try {
      const res = await fetch("/api/pt-pks/satuan-material");
      if (res.ok) {
        const data = await res.json();
        setSatuans(data);
      }
    } catch (error) {
      console.error("Error fetching satuans:", error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/pt-pks/material");
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  // Kategori handlers
  const handleKategoriSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = "/api/pt-pks/kategori-material";
      const method = selectedKategori ? "PUT" : "POST";
      const body = selectedKategori
        ? { id: selectedKategori.id, ...kategoriForm }
        : kategoriForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowKategoriForm(false);
        setSelectedKategori(null);
        setKategoriForm({ name: "", description: "" });
        fetchKategoris();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menyimpan kategori");
      }
    } catch (error) {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKategori = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/pt-pks/kategori-material?id=${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchKategoris();
      }
    } catch (error) {
      console.error("Error deleting kategori:", error);
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
      setDeleteType(null);
    }
  };

  // Satuan handlers
  const handleSatuanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = "/api/pt-pks/satuan-material";
      const method = selectedSatuan ? "PUT" : "POST";
      const body = selectedSatuan
        ? { id: selectedSatuan.id, ...satuanForm }
        : satuanForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowSatuanForm(false);
        setSelectedSatuan(null);
        setSatuanForm({ name: "", symbol: "" });
        fetchSatuans();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menyimpan satuan");
      }
    } catch (error) {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSatuan = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/pt-pks/satuan-material?id=${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchSatuans();
      }
    } catch (error) {
      console.error("Error deleting satuan:", error);
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
      setDeleteType(null);
    }
  };

  // Material handlers
  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = "/api/pt-pks/material";
      const method = selectedMaterial ? "PUT" : "POST";
      const body = selectedMaterial
        ? { id: selectedMaterial.id, ...materialForm }
        : materialForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowMaterialForm(false);
        setSelectedMaterial(null);
        setMaterialForm({
          name: "",
          code: "",
          description: "",
          kategoriId: "",
          satuanId: "",
        });
        fetchMaterials();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menyimpan material");
      }
    } catch (error) {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/pt-pks/material?id=${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchMaterials();
      }
    } catch (error) {
      console.error("Error deleting material:", error);
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
      setDeleteType(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Material</CardTitle>
        <CardDescription>
          Kelola kategori, satuan, dan data material
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="kategori">Kategori</TabsTrigger>
            <TabsTrigger value="satuan">Satuan</TabsTrigger>
            <TabsTrigger value="material">Material</TabsTrigger>
          </TabsList>

          {/* Kategori Tab */}
          <TabsContent value="kategori" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setSelectedKategori(null);
                  setKategoriForm({ name: "", description: "" });
                  setShowKategoriForm(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kategori
              </Button>
            </div>

            {showKategoriForm && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedKategori ? "Edit Kategori" : "Tambah Kategori Baru"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleKategoriSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                        {error}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="kategoriName">Nama Kategori *</Label>
                      <Input
                        id="kategoriName"
                        value={kategoriForm.name}
                        onChange={(e) =>
                          setKategoriForm({ ...kategoriForm, name: e.target.value })
                        }
                        placeholder="TBS, CPO, dll"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="kategoriDescription">Deskripsi</Label>
                      <Input
                        id="kategoriDescription"
                        value={kategoriForm.description}
                        onChange={(e) =>
                          setKategoriForm({
                            ...kategoriForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Deskripsi kategori"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading}>
                        {loading ? "Menyimpan..." : "Simpan"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowKategoriForm(false);
                          setSelectedKategori(null);
                          setError("");
                        }}
                      >
                        Batal
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kategoris.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Belum ada data kategori
                    </TableCell>
                  </TableRow>
                ) : (
                  kategoris.map((kategori) => (
                    <TableRow key={kategori.id}>
                      <TableCell className="font-medium">{kategori.name}</TableCell>
                      <TableCell>{kategori.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedKategori(kategori);
                              setKategoriForm({
                                name: kategori.name,
                                description: kategori.description || "",
                              });
                              setShowKategoriForm(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog open={deleteDialogOpen && deleteType === "kategori" && deleteId === kategori.id} onOpenChange={(open) => {
                            setDeleteDialogOpen(open);
                            if (!open) { setDeleteId(null); setDeleteType(null); }
                          }}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setDeleteId(kategori.id); setDeleteType("kategori"); setDeleteDialogOpen(true); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteKategori}>Hapus</AlertDialogAction>
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
          </TabsContent>

          {/* Satuan Tab */}
          <TabsContent value="satuan" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setSelectedSatuan(null);
                  setSatuanForm({ name: "", symbol: "" });
                  setShowSatuanForm(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Satuan
              </Button>
            </div>

            {showSatuanForm && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedSatuan ? "Edit Satuan" : "Tambah Satuan Baru"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSatuanSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                        {error}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="satuanName">Nama Satuan *</Label>
                      <Input
                        id="satuanName"
                        value={satuanForm.name}
                        onChange={(e) =>
                          setSatuanForm({ ...satuanForm, name: e.target.value })
                        }
                        placeholder="Kilogram, Ton, dll"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="satuanSymbol">Simbol *</Label>
                      <Input
                        id="satuanSymbol"
                        value={satuanForm.symbol}
                        onChange={(e) =>
                          setSatuanForm({ ...satuanForm, symbol: e.target.value })
                        }
                        placeholder="kg, ton, dll"
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading}>
                        {loading ? "Menyimpan..." : "Simpan"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowSatuanForm(false);
                          setSelectedSatuan(null);
                          setError("");
                        }}
                      >
                        Batal
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Satuan</TableHead>
                  <TableHead>Simbol</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {satuans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Belum ada data satuan
                    </TableCell>
                  </TableRow>
                ) : (
                  satuans.map((satuan) => (
                    <TableRow key={satuan.id}>
                      <TableCell className="font-medium">{satuan.name}</TableCell>
                      <TableCell>{satuan.symbol}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedSatuan(satuan);
                              setSatuanForm({
                                name: satuan.name,
                                symbol: satuan.symbol,
                              });
                              setShowSatuanForm(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog open={deleteDialogOpen && deleteType === "satuan" && deleteId === satuan.id} onOpenChange={(open) => {
                            setDeleteDialogOpen(open);
                            if (!open) { setDeleteId(null); setDeleteType(null); }
                          }}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setDeleteId(satuan.id); setDeleteType("satuan"); setDeleteDialogOpen(true); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Satuan?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus satuan ini? Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSatuan}>Hapus</AlertDialogAction>
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
          </TabsContent>

          {/* Material Tab */}
          <TabsContent value="material" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setSelectedMaterial(null);
                  setMaterialForm({
                    name: "",
                    code: "",
                    description: "",
                    kategoriId: "",
                    satuanId: "",
                  });
                  setShowMaterialForm(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Material
              </Button>
            </div>

            {showMaterialForm && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedMaterial ? "Edit Material" : "Tambah Material Baru"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleMaterialSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                        {error}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="materialName">Nama Material *</Label>
                        <Input
                          id="materialName"
                          value={materialForm.name}
                          onChange={(e) =>
                            setMaterialForm({ ...materialForm, name: e.target.value })
                          }
                          placeholder="Nama material"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="materialCode">Kode Material *</Label>
                        <Input
                          id="materialCode"
                          value={materialForm.code}
                          onChange={(e) =>
                            setMaterialForm({ ...materialForm, code: e.target.value })
                          }
                          placeholder="MAT-001"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="materialKategori">Kategori *</Label>
                        <Select
                          value={materialForm.kategoriId}
                          onValueChange={(value) =>
                            setMaterialForm({ ...materialForm, kategoriId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {kategoris.map((kategori) => (
                              <SelectItem key={kategori.id} value={kategori.id}>
                                {kategori.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="materialSatuan">Satuan *</Label>
                        <Select
                          value={materialForm.satuanId}
                          onValueChange={(value) =>
                            setMaterialForm({ ...materialForm, satuanId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih satuan" />
                          </SelectTrigger>
                          <SelectContent>
                            {satuans.map((satuan) => (
                              <SelectItem key={satuan.id} value={satuan.id}>
                                {satuan.name} ({satuan.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="materialDescription">Deskripsi</Label>
                      <Input
                        id="materialDescription"
                        value={materialForm.description}
                        onChange={(e) =>
                          setMaterialForm({
                            ...materialForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Deskripsi material"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading}>
                        {loading ? "Menyimpan..." : "Simpan"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowMaterialForm(false);
                          setSelectedMaterial(null);
                          setError("");
                        }}
                      >
                        Batal
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Material</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Belum ada data material
                    </TableCell>
                  </TableRow>
                ) : (
                  materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-mono">{material.code}</TableCell>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>{material.kategori.name}</TableCell>
                      <TableCell>{material.satuan.symbol}</TableCell>
                      <TableCell>{material.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedMaterial(material);
                              setMaterialForm({
                                name: material.name,
                                code: material.code,
                                description: material.description || "",
                                kategoriId: material.kategori.id,
                                satuanId: material.satuan.id,
                              });
                              setShowMaterialForm(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog open={deleteDialogOpen && deleteType === "material" && deleteId === material.id} onOpenChange={(open) => {
                            setDeleteDialogOpen(open);
                            if (!open) { setDeleteId(null); setDeleteType(null); }
                          }}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setDeleteId(material.id); setDeleteType("material"); setDeleteDialogOpen(true); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Material?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus material ini? Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteMaterial}>Hapus</AlertDialogAction>
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
