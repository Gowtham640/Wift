'use client';

import { ReactNode, CSSProperties } from 'react';
import { useWidgetSettings } from '@/hooks/useWidgetSettings';
import { Palette } from 'lucide-react';
import GlowColorPicker from './GlowColorPicker';
import { useState } from 'react';

interface GlassWidgetProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  showGlow?: boolean;
  widgetId?: string;
  allowColorChange?: boolean;
  onClick?: () => void;
}

export default function GlassWidget({
  children,
  className = '',
  glowColor: propGlowColor,
  showGlow = true,
  widgetId,
  allowColorChange = false,
  onClick
}: GlassWidgetProps) {
  const { glowColor: savedGlowColor, updateGlowColor } = useWidgetSettings(widgetId || '');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const glowColor = widgetId ? savedGlowColor : (propGlowColor || '#ffffff');

  const style: CSSProperties = {
    '--glow-color': glowColor
  } as CSSProperties;

  return (
    <div
      className={`relative glass-widget ${
        showGlow ? 'glass-widget-glow' : ''
      } ${showColorPicker ? 'widget-expanded' : ''} overflow-visible ${className}`}
      style={style}
      onClick={onClick}
    >
      {allowColorChange && widgetId && (
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors z-10"
          title="Change glow color"
        >
          <Palette size={16} className="text-white/60" />
        </button>
      )}
      
      {showColorPicker && widgetId && (
        <div className="absolute top-16 right-4 z-20 md:top-14 md:right-4">
          <GlowColorPicker
            currentColor={glowColor}
            onColorChange={(color) => updateGlowColor(widgetId, color)}
            onClose={() => setShowColorPicker(false)}
          />
        </div>
      )}
      
      {children}
    </div>
  );
}

