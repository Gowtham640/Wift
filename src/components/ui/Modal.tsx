'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md'
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className={`glass-widget relative w-full ${sizeClasses[size]} max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
          <h2 className="text-lg md:text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} className="text-white/60" />
          </button>
        </div>
        
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {children}
        </div>
        
        {footer && (
          <div className="p-4 md:p-6 border-t border-white/10 flex justify-end gap-2 md:gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

