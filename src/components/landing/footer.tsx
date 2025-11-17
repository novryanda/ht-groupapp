"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    perusahaan: [
      { label: "Tentang Kami", href: "#about" },
      { label: "Tim Kami", href: "#team" },
      { label: "Karir", href: "#careers" },
      { label: "Berita", href: "#news" },
    ],
    sistem: [
      { label: "Fitur Utama", href: "#features" },
      { label: "Keamanan", href: "#security" },
      { label: "Integrasi", href: "#integration" },
      { label: "Dokumentasi", href: "#docs" },
    ],
    dukungan: [
      { label: "Panduan Pengguna", href: "#guide" },
      { label: "FAQ", href: "#faqs" },
      { label: "Dukungan IT", href: "#support" },
      { label: "Pelatihan", href: "#training" },
    ],
    legal: [
      { label: "Kebijakan Privasi", href: "#privacy" },
      { label: "Syarat & Ketentuan", href: "#terms" },
      { label: "Keamanan Data", href: "#security-policy" },
      { label: "Compliance", href: "#compliance" },
    ],
  };

  const socialMedia = [
    { icon: "facebook", href: "#", label: "Facebook" },
    { icon: "twitter", href: "#", label: "Twitter" },
    { icon: "instagram", href: "#", label: "Instagram" },
    { icon: "linkedin", href: "#", label: "LinkedIn" },
  ];

  const contactInfo = [
    { icon: Mail, text: "support@netkrida.com" },
    { icon: Phone, text: "+62 21-1234-5678" },
    { icon: MapPin, text: "Jakarta, Indonesia" },
  ];

  return (
    <footer className="bg-gradient-to-b from-green-900 to-green-800 border-t border-green-900 text-white">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >

            <div className="mb-4">
              <Image
                src="/netkrida.png"
                alt="Netkrida Logo"
                width={150}
                height={40}
                className="h-10 w-auto drop-shadow-lg"
              />
            </div>
            <p className="text-green-100 mb-6 max-w-sm">
              Sistem Manajemen Perusahaan Terintegrasi untuk meningkatkan efisiensi
              operasional dan produktivitas bisnis Anda.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              {contactInfo.map((item, index) => (
                <div key={index} className="flex items-center space-x-3 text-green-100">
                  <item.icon size={18} className="text-green-300" />
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-green-100 font-semibold mb-4 capitalize">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-green-100 hover:text-green-300 transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="pt-8 border-t border-gray-700"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <p className="text-green-200 text-sm">
              © {currentYear} Netkrida. Hak Cipta Dilindungi.
            </p>

            {/* Social Media */}
            <div className="flex items-center space-x-4">
              {socialMedia.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-green-800 hover:bg-green-700 border border-green-700 hover:border-green-400 flex items-center justify-center text-green-100 hover:text-green-300 transition-all duration-300"
                  aria-label={social.label}
                >
                  <span className="text-lg">{social.icon === "facebook" ? "f" : social.icon === "twitter" ? "𝕏" : social.icon === "instagram" ? "📷" : "in"}</span>
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
