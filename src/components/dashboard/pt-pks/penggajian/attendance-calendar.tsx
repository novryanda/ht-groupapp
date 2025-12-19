"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ATTENDANCE_CATEGORIES } from "@/server/schema/penggajian";
import { Clock, X } from "lucide-react";

// Types
type LemburDetailItem = {
  x15: number;
  x2: number;
  x3: number;
  x4: number;
};

type LemburDetail = Record<string, LemburDetailItem | undefined>;
type TanggalKerja = Record<string, string | undefined>;

type AttendanceCalendarProps = {
  year: number;
  month: number;
  tanggalKerja: TanggalKerja;
  lemburDetail: LemburDetail;
  onAttendanceChange: (day: string, status: string | null) => void;
  onLemburChange: (day: string, lembur: LemburDetailItem | null) => void;
};

// Get color for attendance status
const getAttendanceColor = (code: string | undefined) => {
  if (!code) return "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700";
  
  const category = ATTENDANCE_CATEGORIES.find((c) => c.code === code);
  if (!category) return "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700";

  switch (category.color) {
    case "green":
      return "bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-200";
    case "blue":
      return "bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200";
    case "red":
      return "bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-200";
    case "cyan":
      return "bg-cyan-100 hover:bg-cyan-200 text-cyan-800 dark:bg-cyan-900 dark:hover:bg-cyan-800 dark:text-cyan-200";
    case "orange":
      return "bg-orange-100 hover:bg-orange-200 text-orange-800 dark:bg-orange-900 dark:hover:bg-orange-800 dark:text-orange-200";
    case "yellow":
      return "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:hover:bg-yellow-800 dark:text-yellow-200";
    case "gray":
      return "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200";
    case "purple":
      return "bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-200";
    default:
      return "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700";
  }
};

// Get day name
const getDayName = (year: number, month: number, day: number) => {
  const date = new Date(year, month - 1, day);
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  return days[date.getDay()];
};

// Check if it's weekend
const isWeekend = (year: number, month: number, day: number) => {
  const date = new Date(year, month - 1, day);
  return date.getDay() === 0 || date.getDay() === 6;
};

export function AttendanceCalendar({
  year,
  month,
  tanggalKerja,
  lemburDetail,
  onAttendanceChange,
  onLemburChange,
}: AttendanceCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [lemburDialogOpen, setLemburDialogOpen] = useState(false);
  const [tempLembur, setTempLembur] = useState<LemburDetailItem>({ x15: 0, x2: 0, x3: 0, x4: 0 });

  // Get number of days in month
  const daysInMonth = new Date(year, month, 0).getDate();

  // Handle attendance selection
  const handleAttendanceSelect = useCallback((day: string, code: string) => {
    onAttendanceChange(day, code);
  }, [onAttendanceChange]);

  // Handle clear attendance
  const handleClearAttendance = useCallback((day: string) => {
    onAttendanceChange(day, null);
  }, [onAttendanceChange]);

  // Open lembur dialog
  const openLemburDialog = useCallback((day: string) => {
    setSelectedDay(day);
    const existing = lemburDetail[day];
    setTempLembur(existing || { x15: 0, x2: 0, x3: 0, x4: 0 });
    setLemburDialogOpen(true);
  }, [lemburDetail]);

  // Save lembur
  const saveLembur = useCallback(() => {
    if (selectedDay) {
      onLemburChange(selectedDay, tempLembur);
      setLemburDialogOpen(false);
      setSelectedDay(null);
    }
  }, [selectedDay, tempLembur, onLemburChange]);

  // Calculate total lembur for a day
  const getDayLemburTotal = (day: string) => {
    const lembur = lemburDetail[day];
    if (!lembur) return 0;
    return lembur.x15 + lembur.x2 + lembur.x3 + lembur.x4;
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
        <span className="text-sm font-medium mr-2">Keterangan:</span>
        {ATTENDANCE_CATEGORIES.map((cat) => (
          <Badge
            key={cat.code}
            variant="outline"
            className={cn("text-xs", getAttendanceColor(cat.code))}
          >
            {cat.code} = {cat.label}
          </Badge>
        ))}
      </div>

      {/* Calendar Grid */}
      <ScrollArea className="w-full">
        <div className="grid grid-cols-7 md:grid-cols-11 lg:grid-cols-16 gap-2 min-w-[700px] pb-2">
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = String(i + 1);
            const status = tanggalKerja[day];
            const hasLembur = getDayLemburTotal(day) > 0;
            const weekend = isWeekend(year, month, i + 1);
            const dayName = getDayName(year, month, i + 1);

            return (
              <div key={day} className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-16 flex flex-col items-center justify-center p-1 relative",
                        getAttendanceColor(status),
                        weekend && !status && "bg-gray-50 dark:bg-gray-900"
                      )}
                    >
                      <span className="text-[10px] text-muted-foreground">{dayName}</span>
                      <span className="font-semibold">{day}</span>
                      <span className="text-xs font-medium">{status || "-"}</span>
                      {hasLembur && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 -right-1 h-4 px-1 text-[10px] bg-orange-500 text-white"
                        >
                          {getDayLemburTotal(day)}m
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">Tanggal {day}</span>
                        {status && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-red-500"
                            onClick={() => handleClearAttendance(day)}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Hapus
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {ATTENDANCE_CATEGORIES.map((cat) => (
                          <Button
                            key={cat.code}
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-8 text-xs px-1",
                              status === cat.code && "ring-2 ring-primary",
                              getAttendanceColor(cat.code)
                            )}
                            onClick={() => handleAttendanceSelect(day, cat.code)}
                          >
                            {cat.code}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => openLemburDialog(day)}
                      >
                        <Clock className="h-3 w-3 mr-2" />
                        Input Lembur
                        {hasLembur && (
                          <Badge variant="secondary" className="ml-2 bg-orange-500 text-white">
                            {getDayLemburTotal(day)}m
                          </Badge>
                        )}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Lembur Dialog */}
      <Dialog open={lemburDialogOpen} onOpenChange={setLemburDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Input Jam Lembur - Tanggal {selectedDay}</DialogTitle>
            <DialogDescription>
              Masukkan jumlah menit lembur untuk setiap kategori pengali.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="x15">x1.5 (Menit)</Label>
                <Input
                  id="x15"
                  type="number"
                  min="0"
                  value={tempLembur.x15}
                  onChange={(e) => setTempLembur({ ...tempLembur, x15: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="x2">x2 (Menit)</Label>
                <Input
                  id="x2"
                  type="number"
                  min="0"
                  value={tempLembur.x2}
                  onChange={(e) => setTempLembur({ ...tempLembur, x2: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="x3">x3 (Menit)</Label>
                <Input
                  id="x3"
                  type="number"
                  min="0"
                  value={tempLembur.x3}
                  onChange={(e) => setTempLembur({ ...tempLembur, x3: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="x4">x4 (Menit)</Label>
                <Input
                  id="x4"
                  type="number"
                  min="0"
                  value={tempLembur.x4}
                  onChange={(e) => setTempLembur({ ...tempLembur, x4: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Preview Calculation */}
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Menit:</span>
                <span className="font-medium">
                  {tempLembur.x15 + tempLembur.x2 + tempLembur.x3 + tempLembur.x4} menit
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Menit Dibayar:</span>
                <span className="font-medium text-orange-600">
                  {Math.round(
                    (tempLembur.x15 * 1.5) + 
                    (tempLembur.x2 * 2) + 
                    (tempLembur.x3 * 3) + 
                    (tempLembur.x4 * 4)
                  )} menit
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>Perhitungan:</p>
              <p>• x1.5: {tempLembur.x15} × 1.5 = {tempLembur.x15 * 1.5} menit</p>
              <p>• x2: {tempLembur.x2} × 2 = {tempLembur.x2 * 2} menit</p>
              <p>• x3: {tempLembur.x3} × 3 = {tempLembur.x3 * 3} menit</p>
              <p>• x4: {tempLembur.x4} × 4 = {tempLembur.x4 * 4} menit</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLemburDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={saveLembur}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
