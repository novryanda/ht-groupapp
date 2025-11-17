"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Shield,
  Users,
  TrendingUp,
  BarChart3,
  FileText,
  Package,
  Truck,
  Settings,
  Clock,
} from "lucide-react";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
const AnimatedCircularProgressBar = dynamic(() => import("@/components/ui/animated-circular-progress-bar").then(m => m.AnimatedCircularProgressBar), { ssr: false });

export default function HomePage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  const features = [
    {
      icon: Database,
      title: "Manajemen Data Terpusat",
      description: "Kelola seluruh data perusahaan dalam satu sistem terintegrasi",
      gradient: "from-green-400 to-emerald-500",
    },
    {
      icon: Shield,
      title: "Keamanan Tingkat Enterprise",
      description: "Proteksi data dengan enkripsi dan kontrol akses berbasis peran",
      gradient: "from-blue-400 to-cyan-500",
    },
    {
      icon: Users,
      title: "Kolaborasi Tim",
      description: "Tingkatkan produktivitas dengan alat kolaborasi yang efisien",
      gradient: "from-green-500 to-teal-500",
    },
    {
      icon: TrendingUp,
      title: "Analitik Real-time",
      description: "Dashboard interaktif untuk monitoring kinerja bisnis",
      gradient: "from-emerald-400 to-green-600",
    },
    {
      icon: BarChart3,
      title: "Pelaporan Otomatis",
      description: "Generate laporan komprehensif dengan sekali klik",
      gradient: "from-teal-400 to-cyan-500",
    },
    {
      icon: FileText,
      title: "Dokumentasi Digital",
      description: "Sistem arsip digital untuk kemudahan akses dokumen",
      gradient: "from-green-600 to-emerald-700",
    },
  ];

  const modules = [
    {
      icon: Package,
      title: "Manajemen Inventori",
      description: "Kontrol stok dan aset perusahaan secara real-time",
    },
    {
      icon: Truck,
      title: "Logistik & Distribusi",
      description: "Optimalkan proses pengiriman dan tracking barang",
    },
    {
      icon: Users,
      title: "SDM & Kepegawaian",
      description: "Kelola data karyawan dan sistem penggajian",
    },
    {
      icon: FileText,
      title: "Keuangan & Akuntansi",
      description: "Pembukuan otomatis dan laporan keuangan",
    },
  ];

  const stats = [
    { value: "99.9%", label: "Uptime Sistem" },
    { value: "<1s", label: "Response Time" },
    { value: "24/7", label: "Dukungan IT" },
    { value: "100%", label: "Data Backup" },
  ];

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(25);

  const handleAksesSistem = (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    setProgress(25);
    setTimeout(() => setProgress(50), 500);
    setTimeout(() => setProgress(100), 1000);
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/auth";
    }, 1400);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-white via-green-50/30 to-white">
      <Header />

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-200/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <motion.div
          style={{ opacity, scale }}
          className="container mx-auto px-4 lg:px-8 relative z-10"
        >
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2 bg-green-50 border border-green-200 rounded-full px-6 py-3 mb-8"
            >
              <Settings className="w-5 h-5 text-green-600" />
              <span className="text-gray-700 text-sm font-medium">
                Sistem Manajemen Perusahaan Terintegrasi
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight"
            >
              <span className="text-gray-900">Transformasi Digital</span>
              <br />
              <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 bg-clip-text text-transparent">
                Untuk Perusahaan Anda
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto"
            >
              Platform komprehensif untuk mengelola operasional, meningkatkan efisiensi,
              dan mendorong pertumbuhan bisnis yang berkelanjutan.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-green-500/30 transition-all duration-300 hover:shadow-green-500/50 hover:scale-105"
                onClick={handleAksesSistem}
                disabled={loading}
              >
                {loading ? "Loading..." : (
                  <>
                    Akses Sistem
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
                    {/* Loading Overlay */}
                    {loading && (
                      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <AnimatedCircularProgressBar
                          value={progress}
                          gaugePrimaryColor="#22c55e"
                          gaugeSecondaryColor="#e5e7eb"
                        />
                      </div>
                    )}
              <a
                href="https://netkrida.co.id/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-green-600 text-green-700 hover:bg-green-50 px-8 py-6 text-lg"
                >
                  Informasi Lebih Lanjut
                </Button>
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 text-sm">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-green-600/30 rounded-full flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-green-600/60 rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Fitur Unggulan Sistem
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Solusi lengkap untuk kebutuhan manajemen perusahaan modern
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative bg-white border-2 border-green-100 hover:border-green-300 rounded-2xl p-8 hover:shadow-xl hover:shadow-green-100/50 transition-all duration-300"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="py-32 relative bg-gradient-to-b from-green-50/50 to-white">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Modul Terintegrasi
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Sistem modular yang dapat disesuaikan dengan kebutuhan bisnis Anda
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((module, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-green-200 rounded-xl p-6 hover:shadow-lg hover:border-green-400 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                  <module.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {module.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {module.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 relative bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Mengapa Memilih Sistem Kami?
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Solusi manajemen perusahaan yang dirancang khusus untuk
                meningkatkan efisiensi operasional dan mendukung pertumbuhan bisnis.
              </p>

              <div className="space-y-4">
                {[
                  "Interface intuitif dan mudah digunakan",
                  "Dukungan teknis 24/7 dari tim profesional",
                  "Integrasi seamless dengan sistem existing",
                  "Update berkala dan peningkatan fitur",
                  "Keamanan data dengan standar internasional",
                  "Skalabilitas tinggi untuk pertumbuhan bisnis",
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 text-lg">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative w-full h-[500px] rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-200 flex items-center justify-center overflow-hidden">
                <div className="relative z-10 text-center p-8">
                  <Clock className="w-24 h-24 text-green-600 mx-auto mb-6" />
                  <p className="text-2xl font-semibold text-gray-900 mb-4">
                    Sistem Terintegrasi & Efisien
                  </p>
                  <p className="text-gray-600">
                    Otomatisasi proses bisnis untuk produktivitas maksimal
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-32 relative bg-gradient-to-br from-green-600 to-emerald-700">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Siap Meningkatkan Efisiensi Perusahaan?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Bergabunglah dengan perusahaan-perusahaan yang telah bertransformasi
              dengan sistem manajemen kami.
            </p>
            <Link href="/auth">
              <Button
                size="lg"
                className="bg-white text-green-700 hover:bg-gray-50 font-semibold px-12 py-7 text-xl shadow-2xl hover:scale-105 transition-all duration-300"
              >
                Mulai Sekarang
                <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
