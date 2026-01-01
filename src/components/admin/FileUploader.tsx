'use client';

import { useState, ChangeEvent } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassWidget from '@/components/ui/GlassWidget';
import { type Exercise } from '@/lib/db';
import * as XLSX from 'xlsx';

interface FileUploaderProps {
  onUpload: (exercises: Omit<Exercise, 'id'>[]) => Promise<void>;
}

interface ParsedExercise {
  name: string;
  muscleGroup: string;
  equipment?: string;
  isValid: boolean;
  error?: string;
}

export default function FileUploader({ onUpload }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedExercise[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    let data: string[][] = [];

    try {
      if (selectedFile.name.toLowerCase().endsWith('.csv')) {
        // Handle CSV files
        const text = await selectedFile.text();
        const lines = text.split('\n').filter(line => line.trim());
        data = lines.map(line => line.split(',').map(s => s.trim()));
      } else if (selectedFile.name.toLowerCase().endsWith('.xlsx') || selectedFile.name.toLowerCase().endsWith('.xls')) {
        // Handle Excel files
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        data = jsonData;
      } else {
        throw new Error('Unsupported file type. Please upload a CSV or Excel file.');
      }

      // Skip header if present (check if first row contains 'name')
      const dataLines = data.length > 0 && data[0].some(cell => cell?.toString().toLowerCase().includes('name'))
        ? data.slice(1)
        : data;

      const parsed: ParsedExercise[] = dataLines.map((row, index) => {
        const [name, muscleGroup, equipment] = row.map(cell => cell?.toString().trim() || '');

        if (!name || !muscleGroup) {
          return {
            name: name || `Row ${index + 1}`,
            muscleGroup: muscleGroup || '',
            equipment: equipment || undefined,
            isValid: false,
            error: 'Missing required fields'
          };
        }

        return {
          name,
          muscleGroup,
          equipment: equipment || undefined,
          isValid: true
        };
      });

      setPreview(parsed);
    } catch (error) {
      console.error('Error parsing file:', error);
      setPreview([{
        name: 'Error',
        muscleGroup: '',
        equipment: undefined,
        isValid: false,
        error: 'Failed to parse file. Please check the format.'
      }]);
    }
  };

  const handleUpload = async () => {
    const validExercises = preview
      .filter(ex => ex.isValid)
      .map(({ name, muscleGroup, equipment }) => ({
        name,
        muscleGroup,
        equipment,
        isCustom: true
      }));

    if (validExercises.length === 0) return;

    setIsUploading(true);
    try {
      await onUpload(validExercises);
      setFile(null);
      setPreview([]);
    } finally {
      setIsUploading(false);
    }
  };

  const validCount = preview.filter(ex => ex.isValid).length;
  const invalidCount = preview.length - validCount;

  return (
    <GlassWidget className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Bulk Upload (CSV/Excel)</h3>

      <div className="mb-4">
        <p className="text-sm text-white/60 mb-2">
          Format: name, muscleGroup, equipment (optional)
        </p>
        <p className="text-xs text-white/40 mb-1">
          CSV: Bench Press, Chest, Barbell
        </p>
        <p className="text-xs text-white/40">
          Excel: Same columns in first sheet
        </p>
      </div>

      <div className="mb-4">
        <label className="btn btn-secondary cursor-pointer">
          <Upload size={20} />
          Choose File
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        {file && (
          <p className="text-sm text-white/60 mt-2">
            Selected: {file.name}
          </p>
        )}
      </div>

      {preview.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle size={16} />
              {validCount} valid
            </div>
            {invalidCount > 0 && (
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={16} />
                {invalidCount} invalid
              </div>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {preview.map((exercise, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  exercise.isValid
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-red-500/10 border border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{exercise.name}</p>
                    <p className="text-sm text-white/60">
                      {exercise.muscleGroup}
                      {exercise.equipment && ` • ${exercise.equipment}`}
                    </p>
                  </div>
                  {!exercise.isValid && (
                    <p className="text-xs text-red-400">{exercise.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleUpload}
            disabled={validCount === 0 || isUploading}
          >
            Import {validCount} Exercise{validCount !== 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </GlassWidget>
  );
}
