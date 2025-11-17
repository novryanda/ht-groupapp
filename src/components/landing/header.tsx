"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
const AnimatedCircularProgressBar = dynamic(() => import("@/components/ui/animated-circular-progress-bar").then(m => m.AnimatedCircularProgressBar), { ssr: false });
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(25);
    // Handler untuk tombol login
    const handleLogin = (e: React.MouseEvent) => {
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
  const { scrollY } = useScroll();

  const headerBackground = useTransform(
    scrollY,
    [0, 100],
    ["rgba(243, 244, 246, 1)", "rgba(229, 231, 235, 1)"] // Tailwind gray-100/200
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Beranda", href: "#home" },
    { label: "Fitur", href: "#features" },
    { label: "Tentang", href: "#about" },
    { label: "Kontak", href: "#contact" },
  ];

  return (
    <motion.header
      style={{ backgroundColor: headerBackground }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "backdrop-blur-lg border-b border-gray-200 shadow-sm" : ""
      } bg-gray-100`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center"
            >
              <Image
                src="/netkrida.png"
                alt="Netkrida Logo"
                width={150}
                height={40}
                className="h-10 w-auto drop-shadow-lg"
                priority
              />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className="text-gray-700 hover:text-green-600 transition-colors duration-200 font-medium"
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Login Button */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden md:block"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-400 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-8 shadow-lg shadow-green-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/40"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Loading..." : "Login"}
            </Button>
          </motion.div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-gray-200 bg-gray-100/95 backdrop-blur-lg"
          >
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 hover:text-green-600 transition-colors duration-200 font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-green-400 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "Loading..." : "Login"}
              </Button>
            </nav>
          </motion.div>
        )}
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
      </div>
    </motion.header>
  );
}
