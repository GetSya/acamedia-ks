import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Search, Menu, X } from 'lucide-react';
import { useAuthStore, useCartStore } from '../store/useStore';
import { Button } from './UI';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function Navbar() {
  const { user, setUser } = useAuthStore();
  const { items } = useCartStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null, null);
      navigate('/');
    } catch (error) {
      console.error('Logout failed');
    }
  };

  return (
    <nav className="bg-white border-b border-[#e2e8f0] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src="https://files.catbox.moe/8kjeul.jpg" alt="ACAMEDIA" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-xl font-extrabold tracking-tighter text-emerald-600">
              ACAMEDIA
            </span>
          </Link>


          {/* Right Section */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/marketplace" className="text-gray-600 hover:text-emerald-600 font-medium">Marketplace</Link>
            <Link to="/history" className="text-gray-600 hover:text-emerald-600 font-medium">Riwayat Pesanan</Link>
            
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-emerald-600 transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-3 ml-2 border-l pl-5 border-gray-100">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{user.nama_lengkap}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <Link to={user.role === 'admin' ? '/admin' : '/profile'} className="p-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <User className="w-6 h-6" />
                </Link>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost">Masuk</Button>
                </Link>
                <Link to="/register">
                  <Button>Daftar</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <Link to="/cart" className="relative p-2 text-gray-600">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-50 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              <Link to="/marketplace" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-600 font-medium">Marketplace</Link>
              {user ? (
                <>
                  <Link to={user.role === 'admin' ? '/admin' : '/profile'} onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-600 font-medium">Profile</Link>
                  <Link to="/history" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-600 font-medium">History Order</Link>
                  <button onClick={handleLogout} className="w-full text-left py-2 text-red-500 font-medium flex items-center gap-2">
                    <LogOut className="w-5 h-5" /> Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2 border-t">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Log In</Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
