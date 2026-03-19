"use client";

import { useMemo, useState } from "react";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** index;
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[index]}`;
}

export default function TransactionUpload() {
  const [file, setFile] = useState<File | null>(null);

  const transactionReference = useMemo(() => {
    if (!file) return "N/A";
    return file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "-").toUpperCase();
  }, [file]);

  return (
    <div className="mt-6 rounded-2xl border border-white/10 p-4 md:p-5">
      <h3 className="text-lg font-semibold text-white">Upload your screenshot</h3>
      <p className="mt-1 text-sm text-gray-400">
        Add your payment screenshot and we will read transaction info from the file details.
      </p>

      <label className="app-bg-elevated mt-4 block cursor-pointer rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-200 hover:border-white/20">
        <span>{file ? "Change Screenshot" : "Choose Screenshot"}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div className="app-bg-elevated rounded-xl border border-white/10 px-3 py-2">
          <p className="text-gray-400">File Name</p>
          <p className="truncate text-gray-100">{file?.name ?? "No screenshot uploaded"}</p>
        </div>
        <div className="app-bg-elevated rounded-xl border border-white/10 px-3 py-2">
          <p className="text-gray-400">File Size</p>
          <p className="text-gray-100">{file ? formatBytes(file.size) : "N/A"}</p>
        </div>
        <div className="app-bg-elevated rounded-xl border border-white/10 px-3 py-2">
          <p className="text-gray-400">Captured Date</p>
          <p className="text-gray-100">
            {file ? new Date(file.lastModified).toLocaleString() : "N/A"}
          </p>
        </div>
        <div className="app-bg-elevated rounded-xl border border-white/10 px-3 py-2">
          <p className="text-gray-400">Transaction Reference</p>
          <p className="truncate text-gray-100">{transactionReference}</p>
        </div>
      </div>
    </div>
  );
}
