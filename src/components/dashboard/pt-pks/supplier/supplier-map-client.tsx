
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

type SupplierMarker = {
  id: string;
  type: string;
  ownerName: string;
  companyName: string | null;
  address: string;
  personalPhone: string;
  longitude: number;
  latitude: number;
};

type SupplierTypeLabel = {
  [key: string]: string;
};

const supplierTypeLabels: SupplierTypeLabel = {
  RAMP_PERON: "Ramp/Peron",
  KUD: "KUD",
  KELOMPOK_TANI: "Kelompok Tani",
};

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

export default function SupplierMapClient() {
  const [suppliers, setSuppliers] = useState<SupplierMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Default center (Indonesia)
  const defaultCenter: LatLngExpression = [-2.5489, 118.0149];
  const defaultZoom = 5;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchSuppliers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/pt-pks/supplier?type=map");
      const data = await response.json();
      if (response.ok) {
        setSuppliers(data.suppliers);
      } else {
        console.error("Error fetching suppliers:", data.error);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fix Leaflet icon issue in production
  useEffect(() => {
    if (!mounted) return;
    const L = require("leaflet");
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="h-[480px] w-full rounded-md border bg-muted flex items-center justify-center">
        <div className="text-muted-foreground">Loading suppliers...</div>
      </div>
    );
  }

  // Calculate center based on suppliers
  const center: LatLngExpression =
    suppliers.length > 0 && suppliers[0]
      ? [suppliers[0].latitude, suppliers[0].longitude]
      : defaultCenter;

  const zoom = suppliers.length > 0 ? 8 : defaultZoom;

  return (
    <div className="relative h-[480px] w-full rounded-md border overflow-hidden z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {suppliers.map((supplier) => (
          <Marker
            key={supplier.id}
            position={[supplier.latitude, supplier.longitude]}
          >
            <Popup>
              <div className="min-w-[220px] max-w-[260px] space-y-2 p-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block bg-primary/10 text-primary rounded-full p-1">
                    <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' /></svg>
                  </span>
                  <div>
                    <div className="font-semibold text-base leading-tight">{supplier.ownerName}</div>
                    {supplier.companyName && (
                      <div className="text-xs text-muted-foreground leading-tight">{supplier.companyName}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-block text-muted-foreground">
                    <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 20l-5.447-2.724A2 2 0 013 15.382V6a2 2 0 012-2h14a2 2 0 012 2v9.382a2 2 0 01-1.553 1.894L15 20m-6 0v-2a2 2 0 012-2h2a2 2 0 012 2v2' /></svg>
                  </span>
                  <span>{supplierTypeLabels[supplier.type] || supplier.type}</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span className="inline-block text-muted-foreground pt-0.5">
                    <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 12.414a4 4 0 10-1.414 1.414l4.243 4.243a1 1 0 001.414-1.414z' /></svg>
                  </span>
                  <span>{supplier.address}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-block text-muted-foreground">
                    <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm0 12a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2zm12-12a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zm0 12a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' /></svg>
                  </span>
                  <span>{supplier.personalPhone}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
