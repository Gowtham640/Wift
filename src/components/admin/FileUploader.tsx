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

      // Check if we have any data rows
      if (dataLines.length === 0) {
        setPreview([{
          name: 'No Data Found',
          muscleGroup: '',
          equipment: undefined,
          isValid: false,
          error: 'The file appears to be empty or contains no data rows. Please ensure your file has exercise data in the expected format.'
        }]);
        return;
      }

      const parsed: ParsedExercise[] = dataLines.map((row, index) => {
        const [name, muscleGroup, equipment] = row.map(cell => cell?.toString().trim() || '');
        const rowNumber = data[0].some(cell => cell?.toString().toLowerCase().includes('name')) ? index + 2 : index + 1;

        // Check if row has enough columns
        if (row.length < 2) {
          return {
            name: `Row ${rowNumber}`,
            muscleGroup: '',
            equipment: undefined,
            isValid: false,
            error: `Row ${rowNumber}: Insufficient columns. Expected at least 2 columns (name, muscleGroup), found ${row.length} column${row.length !== 1 ? 's' : ''}. ${row.length > 0 ? `Found data: "${row.join('", "')}"` : ''}`
          };
        }

        // Detailed error checking
        const missingFields: string[] = [];
        const presentFields: string[] = [];

        if (!name) {
          missingFields.push('name');
        } else {
          presentFields.push(`name: "${name}"`);
        }

        if (!muscleGroup) {
          missingFields.push('muscleGroup');
        } else {
          presentFields.push(`muscleGroup: "${muscleGroup}"`);
        }

        if (equipment) {
          presentFields.push(`equipment: "${equipment}"`);
        }

        if (missingFields.length > 0) {
          const errorParts = [
            `Row ${rowNumber}: Missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}`
          ];

          if (presentFields.length > 0) {
            errorParts.push(`Present: ${presentFields.join(', ')}`);
          }

          return {
            name: name || `Row ${rowNumber}`,
            muscleGroup: muscleGroup || '',
            equipment: equipment || undefined,
            isValid: false,
            error: errorParts.join('. ')
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

      let errorMessage = 'Failed to parse file. ';
      if (error instanceof Error) {
        if (error.message.includes('Unsupported file type')) {
          errorMessage += 'Only CSV (.csv) and Excel (.xlsx, .xls) files are supported.';
        } else if (error.message.includes('read')) {
          errorMessage += 'Could not read the file. Please ensure it\'s not corrupted and try again.';
        } else {
          errorMessage += `Error: ${error.message}`;
        }
      } else {
        errorMessage += 'Please check the file format and try again.';
      }

      setPreview([{
        name: 'File Parsing Error',
        muscleGroup: '',
        equipment: undefined,
        isValid: false,
        error: errorMessage
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
            <div className="text-white/40">
              Total: {preview.length} row{preview.length !== 1 ? 's' : ''}
            </div>
          </div>

          {invalidCount > 0 && (
            <div className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="font-medium mb-1">Issues found:</p>
              <ul className="space-y-1">
                {preview
                  .map((exercise, index) => ({ exercise, index }))
                  .filter(({ exercise }) => !exercise.isValid)
                  .slice(0, 5) // Show first 5 errors
                  .map(({ exercise, index }) => (
                    <li key={index} className="text-yellow-300">
                      • {exercise.error}
                    </li>
                  ))
                }
                {invalidCount > 5 && (
                  <li className="text-yellow-400/60">
                    ... and {invalidCount - 5} more issue{invalidCount - 5 !== 1 ? 's' : ''}
                  </li>
                )}
              </ul>
            </div>
          )}

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
