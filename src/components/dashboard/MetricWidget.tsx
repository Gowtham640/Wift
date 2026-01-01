'use client';

import { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import GlassWidget from '@/components/ui/GlassWidget';
import Input from '@/components/ui/Input';

interface MetricWidgetProps {
  widgetId: string;
  title: string;
  value: number | string;
  unit?: string;
  icon?: React.ReactNode;
  onUpdate?: (value: number) => void;
  editable?: boolean;
  color?: string;
}

export default function MetricWidget({
  widgetId,
  title,
  value,
  unit,
  icon,
  onUpdate,
  editable = true,
  color
}: MetricWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleSave = () => {
    if (onUpdate) {
      const numValue = parseFloat(editValue);
      if (!isNaN(numValue)) {
        onUpdate(numValue);
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  return (
    <GlassWidget widgetId={widgetId} showGlow allowColorChange className="p-4 md:p-6">
      <div className="flex items-start justify-between mb-3 md:mb-4 pr-10">
        <div className="flex items-center gap-2">
          {icon && <div className="text-white/60">{icon}</div>}
          <h3 className="text-xs md:text-sm font-medium text-white/60">{title}</h3>
        </div>
        {editable && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <Edit2 size={14} className="text-white/40" />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 btn btn-primary py-2 text-sm"
            >
              <Check size={16} />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 btn btn-secondary py-2 text-sm"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-2xl md:text-3xl font-bold text-white">
            {typeof value === 'number' ? value.toFixed(1) : value}
          </span>
          {unit && <span className="text-base md:text-lg text-white/60">{unit}</span>}
        </div>
      )}
    </GlassWidget>
  );
}

