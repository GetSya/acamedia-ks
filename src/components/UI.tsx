import React, { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export function Button({ 
  children, 
  onClick, 
  className, 
  variant = 'primary', 
  type = 'button',
  disabled 
}: ButtonProps) {
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'hover:bg-gray-100 text-gray-600',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm',
        variants[variant],
        className
      )}
    >
      {children}
    </motion.button>
  );
}

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  error?: string;
  registration?: any;
}

export function Input({ 
  label, 
  type = 'text', 
  placeholder, 
  className, 
  error,
  registration 
}: InputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-sm font-medium text-gray-700 ml-1">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        className={cn(
          'px-4 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200',
          error ? 'border-red-500 ring-red-500/20' : 'hover:border-emerald-300',
          className
        )}
        {...registration}
      />
      {error && <span className="text-xs text-red-500 ml-1">{error}</span>}
    </div>
  );
}

export function Card({ children, className, ...props }: { children: ReactNode; className?: string; [key: string]: any }) {
  return (
    <div className={cn('bg-white p-6 rounded-xl shadow-sleek border border-[#f1f5f9] transition-transform duration-200', className)} {...props}>
      {children}
    </div>
  );
}

export function Badge({ children, variant = 'info', className }: { children: ReactNode; variant?: 'success' | 'warning' | 'error' | 'info'; className?: string }) {
  const variants = {
    success: 'bg-[#dcfce7] text-[#166534]',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-[#e0f2fe] text-[#075985]',
  };

  return (
    <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider', variants[variant], className)}>
      {children}
    </span>
  );
}
