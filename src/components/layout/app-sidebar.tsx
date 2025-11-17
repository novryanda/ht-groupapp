"use client"

import * as React from "react"
import {
  Building2,
  Home,
  Users,
  FileText,
  Settings,
  Database,
  Truck,
  Factory,
  Warehouse,
  ShoppingCart,
  DollarSign,
} from "lucide-react"

import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

interface MenuItem {
  title: string
  url: string
  icon: React.ComponentType
  roles?: string[]
  items?: {
    title: string
    url: string
  }[]
}

const companyMenus: Record<string, MenuItem[]> = {
  "PT-PKS": [
    {
      title: "Dashboard",
      url: "/dashboard/pt-pks",
      icon: Home,
      roles: ["Admin", "Manager", "User"],
    },
    
    // ============ MASTER DATA ============
    {
      title: "Master Data",
      url: "/dashboard/pt-pks/master",
      icon: Database, // import dari lucide-react
      roles: ["Admin"],
      items: [
        { title: "Supplier", url: "/dashboard/pt-pks/master/supplier" },
        { title: "Buyer", url: "/dashboard/pt-pks/master/buyer" },
        { title: "Driver", url: "/dashboard/pt-pks/master/transportir" },
        { title: "Material", url: "/dashboard/pt-pks/master/material" },
      ],
    },
    
    // ============ SUPPLY CHAIN (PROCUREMENT) ============
    {
      title: "Supply Chain",
      url: "/dashboard/pt-pks/supply-chain",
      icon: Truck, // ganti icon jadi lebih relevan
      roles: ["Admin", "Staff Procurement"],
      items: [
        { title: "Penerimaan TBS", url: "/dashboard/pt-pks/supply-chain/penerimaan-tbs" },
        { title: "Pembayaran Supplier", url: "/dashboard/pt-pks/supply-chain/pembayaran-supplier" }, // 🆕
      ],
    },
    
    // ============ PRODUKSI ============
    {
      title: "Produksi",
      url: "/dashboard/pt-pks/produksi",
      icon: Factory, // ganti icon
      roles: ["Admin", "Manager Produksi", "Staff Produksi"],
      items: [
        { title: "Proses Produksi", url: "/dashboard/pt-pks/produksi/proses-produksi" },
        { title: "Laporan Harian", url: "/dashboard/pt-pks/produksi/laporan-harian" },
      ],
    },
    
    // ============ GUDANG / INVENTORY ============ 🆕 BARU!
    {
      title: "Gudang",
      url: "/dashboard/pt-pks/gudang",
      icon: Warehouse,
      roles: ["Admin", "Staff Gudang"],
      items: [
        { title: "Stock TBS", url: "/dashboard/pt-pks/gudang/stock-tbs" },
        { title: "Stock CPO", url: "/dashboard/pt-pks/gudang/stock-cpo" },
        { title: "Stock Kernel", url: "/dashboard/pt-pks/gudang/stock-kernel" },
        { title: "Stock By-Product", url: "/dashboard/pt-pks/gudang/stock-byproduct" }, // Cangkang + Fiber
        { title: "Stock Movement", url: "/dashboard/pt-pks/gudang/stock-movement" },
        { title: "Stock Opname", url: "/dashboard/pt-pks/gudang/stock-opname" },
      ],
    },
    
    // ============ PEMASARAN (SALES) ============
    {
      title: "Pemasaran",
      url: "/dashboard/pt-pks/pemasaran",
      icon: ShoppingCart,
      roles: ["Admin", "Manager Marketing", "Staff Marketing"],
      items: [
        { title: "Penjualan CPO", url: "/dashboard/pt-pks/pemasaran/penjualan-cpo" },
        { title: "Penjualan Kernel", url: "/dashboard/pt-pks/pemasaran/penjualan-kernel" },
        { title: "Penjualan By-Product", url: "/dashboard/pt-pks/pemasaran/penjualan-byproduct" }, // 🔄 Gabung Cangkang + Fiber
        { title: "Piutang Customer", url: "/dashboard/pt-pks/pemasaran/piutang-customer" },
        { title: "Pembayaran Customer", url: "/dashboard/pt-pks/pemasaran/pembayaran-customer" }, // 🆕
      ],
    },
    
    // ============ LAPORAN (REPORTING) ============ 🆕 BARU!
    {
      title: "Laporan",
      url: "/dashboard/pt-pks/laporan",
      icon: FileText,
      roles: ["Admin", "Manager", "Direktur"],
      items: [
        { title: "Laporan Penerimaan TBS", url: "/dashboard/pt-pks/laporan/penerimaan-tbs" },
        { title: "Laporan Produksi", url: "/dashboard/pt-pks/laporan/produksi" },
        { title: "Laporan Penjualan", url: "/dashboard/pt-pks/laporan/penjualan" },
        { title: "Laporan Keuangan", url: "/dashboard/pt-pks/laporan/keuangan" },
        { title: "Laporan Rendemen", url: "/dashboard/pt-pks/laporan/rendemen" },
      ],
    },
    
    // ============ KEUANGAN ============ 🆕 BARU (Opsional)
    {
      title: "Keuangan",
      url: "/dashboard/pt-pks/keuangan",
      icon: DollarSign,
      roles: ["Admin", "Manager Keuangan", "Staff Keuangan"],
      items: [
        { title: "Hutang Supplier", url: "/dashboard/pt-pks/keuangan/hutang-supplier" },
        { title: "Piutang Customer", url: "/dashboard/pt-pks/keuangan/piutang-customer" },
        { title: "Kas & Bank", url: "/dashboard/pt-pks/keuangan/kas-bank" },
        { title: "Jurnal", url: "/dashboard/pt-pks/keuangan/jurnal" },
      ],
    },
    
    // // ============ SETTINGS ============
    // {
    //   title: "Pengaturan",
    //   url: "/dashboard/pt-pks/settings",
    //   icon: Settings,
    //   roles: ["Admin"],
    //   items: [
    //     { title: "Users", url: "/dashboard/pt-pks/settings/users" },
    //     { title: "Roles & Permissions", url: "/dashboard/pt-pks/settings/roles" },
    //     { title: "Company Profile", url: "/dashboard/pt-pks/settings/company" },
    //   ],
    // },
  ],
  "PT-HTK": [
    {
      title: "Dashboard",
      url: "/dashboard/pt-htk",
      icon: Home,
      roles: ["Admin", "Manager", "User"],
    },
    {
      title: "Users",
      url: "/dashboard/pt-htk/users",
      icon: Users,
      roles: ["Admin"],
    },
    {
      title: "Reports",
      url: "/dashboard/pt-htk/reports",
      icon: FileText,
      roles: ["Admin", "Manager"],
    },
  ],
  "PT-NILO": [
    {
      title: "Dashboard",
      url: "/dashboard/pt-nilo",
      icon: Home,
      roles: ["Admin", "Manager", "User"],
    },
    {
      title: "Users",
      url: "/dashboard/pt-nilo/users",
      icon: Users,
      roles: ["Admin"],
    },
    {
      title: "Reports",
      url: "/dashboard/pt-nilo/reports",
      icon: FileText,
      roles: ["Admin", "Manager"],
    },
  ],
  "PT-ZTA": [
    {
      title: "Dashboard",
      url: "/dashboard/pt-zta",
      icon: Home,
      roles: ["Admin", "Manager", "User"],
    },
    {
      title: "Users",
      url: "/dashboard/pt-zta/users",
      icon: Users,
      roles: ["Admin"],
    },
    {
      title: "Reports",
      url: "/dashboard/pt-zta/reports",
      icon: FileText,
      roles: ["Admin", "Manager"],
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: {
      name: string
    }
    company?: {
      code: string
      name: string
    }
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  // Get menus for user's company and filter by role
  const companyCode = user.company?.code
  const menus = companyCode ? companyMenus[companyCode] ?? [] : []
  const filteredMenus = menus.filter(
    (menu) => !menu.roles || menu.roles.includes(user.role?.name ?? "")
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">HT Group</span>
                  <span className="truncate text-xs">
                    {user.company?.name ?? "Application"}
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredMenus} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
