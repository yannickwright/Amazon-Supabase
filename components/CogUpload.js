"use client";

import { useState } from "react";
import apiClient from "@/libs/api";

export default function CogUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setSuccess(false);
    }
  };

  const processCogFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const rows = text.split("\n");
        const cogMap = {};

        // Validate header row
        const headerRow = rows[0].toLowerCase().trim();
        if (!headerRow.includes("sku") || !headerRow.includes("cog")) {
          throw new Error('CSV must have headers "SKU" and "COG"');
        }

        // Skip header row and process each line
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].trim();
          if (!row) continue;

          const [sku, cog] = row.split(",");
          if (sku && cog) {
            const trimmedSku = sku.trim();
            const parsedCog = parseFloat(cog.trim());

            if (!isNaN(parsedCog) && parsedCog >= 0) {
              cogMap[trimmedSku] = parsedCog;
            }
          }
        }

        // Validate we have some data
        if (Object.keys(cogMap).length === 0) {
          throw new Error("No valid COG data found in the CSV");
        }

        // Save to database
        await apiClient.post("/cogs", { cogs: cogMap });
        setSuccess(true);
        setSelectedFile(null);
      };

      reader.readAsText(selectedFile);
    } catch (err) {
      setError(err.message || "Failed to process COG file");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Upload COG Data</h2>
        <p className="text-sm text-gray-600 mb-4">
          Upload a CSV file with SKU and COG data to save your cost of goods.
        </p>

        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="file-input file-input-bordered file-input-sm w-full max-w-xs"
            disabled={isProcessing}
          />
          {selectedFile && (
            <button
              className="btn btn-primary btn-sm"
              onClick={processCogFile}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Processing...
                </>
              ) : (
                "Upload COGs"
              )}
            </button>
          )}
        </div>

        {error && (
          <div className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mt-4">
            <span>COG data successfully uploaded!</span>
          </div>
        )}
      </div>
    </div>
  );
}
