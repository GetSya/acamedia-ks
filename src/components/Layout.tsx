import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="https://files.catbox.moe/8kjeul.jpg" alt="Logo" className="w-8 h-8 rounded-full" />
              <span className="text-xl font-bold text-emerald-600">ACAMEDIA</span>
            </div>
            <p className="text-gray-500 max-w-sm">
              Marketplace produk digital terpercaya. Temukan berbagai jasa dan layanan berkualitas dengan harga terbaik.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Link Cepat</h4>
            <ul className="space-y-2 text-gray-500">
              <li><Link to="/marketplace" className="hover:text-emerald-600">Marketplace</Link></li>
              <li><Link to="/about" className="hover:text-emerald-600">Tentang Kami</Link></li>
              <li><Link to="/contact" className="hover:text-emerald-600">Hubungi Kami</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Bantuan</h4>
            <ul className="space-y-2 text-gray-500">
              <li><Link to="/faq" className="hover:text-emerald-600">FAQ</Link></li>
              <li><Link to="/terms" className="hover:text-emerald-600">Syarat & Ketentuan</Link></li>
              <li><Link to="/privacy" className="hover:text-emerald-600">Kebijakan Privasi</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-gray-50 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} ACAMEDIA. All rights reserved.
        </div>
      </footer>
      <Toaster position="bottom-right" />
    </div>
  );
}

import { Link } from 'react-router-dom';
