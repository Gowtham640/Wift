'use client';

import { DEFAULT_GLOW_COLORS } from '@/lib/types';
import { X } from 'lucide-react';

interface GlowColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  onClose: () => void;
}

export default function GlowColorPicker({
  currentColor,
  onColorChange,
  onClose
}: GlowColorPickerProps) {
  return (
    <div className="glass-widget p-4 min-w-[200px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Glow Color</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X size={16} className="text-white/60" />
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {DEFAULT_GLOW_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorChange(color.value)}
            className={`w-12 h-12 rounded-lg transition-all ${
              currentColor === color.value
                ? 'ring-2 ring-white scale-110'
                : 'hover:scale-105'
            }`}
            style={{
              background: color.value,
              boxShadow: `0 0 20px ${color.value}40`
            }}
            title={color.name}
          />
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-white/10">
        <label className="text-xs text-white/60 mb-1 block">Custom Color</label>
        <input
          type="color"
          value={currentColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-full h-10 rounded-lg cursor-pointer bg-transparent"
        />
      </div>
    </div>
  );
}





