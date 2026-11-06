"use client";

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { EnumerationArea } from '@/types/auth';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  X,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';

interface EaImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (eas: EnumerationArea[]) => void;
}

interface ParsedRow {
  code: string;
  name: string;
  lga: string;
  ward: string;
  segment: string;
  latitude: number;
  longitude: number;
  targetHouseholds?: number;
  isValid: boolean;
  errors: string[];
}

export function EaImportDialog({
  isOpen,
  onClose,
  onImportSuccess
}: EaImportDialogProps) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        code: 'KAN-MUN-004',
        name: 'Mandawari East EA-04',
        lga: 'Kano Municipal',
        ward: 'Mandawari',
        segment: '01',
        latitude: 12.0012,
        longitude: 8.5298,
        targetHouseholds: 10
      },
      {
        code: 'KAN-FAG-003',
        name: 'Fagge B Residential EA-03',
        lga: 'Fagge',
        ward: 'Fagge B',
        segment: '02',
        latitude: 12.0210,
        longitude: 8.5350,
        targetHouseholds: 10
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'EA_Template');
    XLSX.writeFile(wb, 'KaVa_EA_Import_Template.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        const parsed: ParsedRow[] = rawJson.map((row) => {
          const errors: string[] = [];
          const code = String(row.code || row.Code || row['EA Code'] || '').trim();
          const name = String(row.name || row.Name || row['EA Name'] || '').trim();
          const lga = String(row.lga || row.LGA || '').trim();
          const ward = String(row.ward || row.Ward || '').trim();
          const segment = String(row.segment || row.Segment || '01').trim();
          const lat = parseFloat(row.latitude || row.Latitude || row.lat || 0);
          const lng = parseFloat(row.longitude || row.Longitude || row.lng || 0);

          if (!code) errors.push('Missing EA code');
          if (!name) errors.push('Missing EA name');
          if (!lga) errors.push('Missing LGA');
          if (isNaN(lat) || lat < 11.0 || lat > 13.0) {
            errors.push('Latitude must be in Kano State range (~11.5 to 12.5)');
          }
          if (isNaN(lng) || lng < 7.5 || lng > 9.5) {
            errors.push('Longitude must be in Kano State range (~8.0 to 9.2)');
          }

          return {
            code,
            name,
            lga,
            ward,
            segment,
            latitude: lat,
            longitude: lng,
            targetHouseholds: parseInt(row.targetHouseholds || row.Target || 10, 10),
            isValid: errors.length === 0,
            errors
          };
        });

        setRows(parsed);
      } catch (err) {
        alert('Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleCommitImport = async () => {
    const validRows = rows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setIsProcessing(true);
    const newEas: EnumerationArea[] = validRows.map((r, i) => ({
      id: `imported-${r.code.toLowerCase()}-${Date.now()}-${i}`,
      code: r.code,
      name: r.name,
      lga: r.lga,
      ward: r.ward,
      segment: r.segment,
      latitude: r.latitude,
      longitude: r.longitude,
      targetHouseholds: r.targetHouseholds || 10,
      completedHouseholds: 0,
      inProgressHouseholds: 0,
      status: 'not_started',
      notes: 'Imported via CSV/XLSX template',
      updatedAt: new Date().toISOString()
    }));

    await onImportSuccess(newEas);
    setIsProcessing(false);
    onClose();
  };

  const validCount = rows.filter(r => r.isValid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-2xl w-full p-6 shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-primary" />
              Import Enumeration Areas (EAs)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bulk upload EA sampling files (.xlsx or .csv) for Kano State
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* Content */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/40 rounded-lg border border-border">
            <div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-xs font-medium">
                <Upload className="size-3.5" />
                Select File (.xlsx / .csv)
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {fileName && <span className="ml-2 text-xs text-foreground font-mono">{fileName}</span>}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs"
            >
              <Download className="size-3 mr-1" />
              Download Template
            </Button>
          </div>

          {/* Validation Summary */}
          {rows.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <CheckCircle className="size-3.5" />
                <span>{validCount} Valid rows</span>
              </div>
              {invalidCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
                  <AlertTriangle className="size-3.5" />
                  <span>{invalidCount} Invalid rows</span>
                </div>
              )}
            </div>
          )}

          {/* Preview Table */}
          {rows.length > 0 ? (
            <div className="border border-border rounded-lg overflow-x-auto">
              <Table className="min-w-[650px]">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-mono text-xs">Status</TableHead>
                    <TableHead className="font-mono text-xs">Code</TableHead>
                    <TableHead className="font-mono text-xs">Name</TableHead>
                    <TableHead className="font-mono text-xs">LGA</TableHead>
                    <TableHead className="font-mono text-xs">Ward</TableHead>
                    <TableHead className="font-mono text-xs">Coordinates</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 15).map((row, i) => (
                    <TableRow key={i} className={row.isValid ? 'hover:bg-muted/40' : 'bg-destructive/5'}>
                      <TableCell className="p-2">
                        {row.isValid ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium text-xs">Valid</span>
                        ) : (
                          <span className="text-destructive font-medium text-[10px]" title={row.errors.join(', ')}>
                            {row.errors[0]}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono font-medium text-foreground text-xs">{row.code}</TableCell>
                      <TableCell className="text-foreground text-xs">{row.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{row.lga}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{row.ward}</TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {row.latitude.toFixed(4)}, {row.longitude.toFixed(4)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
              <FileSpreadsheet className="size-8 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-xs">No spreadsheet uploaded yet. Choose an Excel or CSV file to preview.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="pt-4 border-t border-border flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={validCount === 0 || isProcessing}
            onClick={handleCommitImport}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="size-3 animate-spin mr-1.5" />
                Importing...
              </>
            ) : (
              `Import ${validCount} EAs`
            )}
          </Button>
        </footer>
      </div>
    </div>
  );
}
