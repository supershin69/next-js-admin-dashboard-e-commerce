"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp, faFileCsv } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/app/components/ui/button";
import { CsvRow, parseCsvText, validateHeaders } from "@/app/lib/csv";

type CsvImportModalProps = {
  open: boolean;
  title: string;
  requiredHeaders: string[];
  optionalHeaders?: string[];
  importing?: boolean;
  onClose: () => void;
  onImport: (rows: CsvRow[]) => Promise<void>;
};

export const CsvImportModal = ({
  open,
  title,
  requiredHeaders,
  optionalHeaders = [],
  importing = false,
  onClose,
  onImport,
}: CsvImportModalProps) => {
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<CsvRow[]>([]);

  if (!open) return null;

  const handleFileChange = async (file?: File) => {
    if (!file) return;
    setError("");
    setFileName(file.name);

    try {
      const text = await file.text();
      const { headers, rows } = parseCsvText(text);
      validateHeaders(headers, requiredHeaders, optionalHeaders);
      setParsedRows(rows);
    } catch (parseError) {
      setParsedRows([]);
      setError(parseError instanceof Error ? parseError.message : "Invalid CSV");
    }
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) {
      setError("No CSV rows found to import.");
      return;
    }
    setError("");
    try {
      await onImport(parsedRows);
      setParsedRows([]);
      setFileName("");
      onClose();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import failed");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-gray-200 bg-background p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">
          Required headers: <span className="font-medium">{requiredHeaders.join(", ")}</span>
        </p>
        {optionalHeaders.length > 0 && (
          <p className="mt-1 text-sm text-gray-600">
            Optional headers: <span className="font-medium">{optionalHeaders.join(", ")}</span>
          </p>
        )}

        <div className="mt-4">
          <input
            id="csv-upload-input"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => handleFileChange(event.target.files?.[0])}
            className="sr-only"
          />
          <label
            htmlFor="csv-upload-input"
            className="group block cursor-pointer rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-5 transition-colors hover:border-emerald-500 hover:bg-emerald-50"
          >
            <div className="flex items-center justify-center gap-3 text-emerald-800">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm">
                <FontAwesomeIcon icon={faCloudArrowUp} />
              </span>
              <div>
                <p className="text-sm font-semibold">Choose CSV file</p>
                <p className="text-xs text-emerald-700">Click to browse and upload</p>
              </div>
            </div>
          </label>
          {fileName && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <FontAwesomeIcon icon={faFileCsv} className="text-emerald-700" />
              <span className="truncate">{fileName}</span>
            </div>
          )}
          {parsedRows.length > 0 && (
            <p className="mt-2 text-xs text-green-700">{parsedRows.length} row(s) ready to import.</p>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-700 text-white hover:bg-emerald-800"
            onClick={handleImport}
            disabled={importing}
          >
            {importing ? "Importing..." : "Import CSV"}
          </Button>
        </div>
      </div>
    </div>
  );
};
