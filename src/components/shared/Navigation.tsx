"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { navigation, couple } from "@/data/wedding";

/* ============================================
   NAVEGACIÓN
   ============================================ */
export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="glass-subtle mx-4 mt-4 px-6 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          {/* Logo */}
          <a
            href="#hero"
            className="text-script text-2xl text-gold hover:text-gold-light transition-colors"
          >
            {couple.displayName}
          </a>

          {/* Desktop Links */}
          <ul className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-body text-sm text-burgundy/80 hover:text-burgundy transition-colors uppercase tracking-widest"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-burgundy p-2"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="glass-strong mx-4 mt-2 p-6 md:hidden"
          >
            <ul className="flex flex-col gap-4">
              {navigation.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="text-body text-base text-burgundy/80 hover:text-burgundy transition-colors uppercase tracking-widest block text-center py-2"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
