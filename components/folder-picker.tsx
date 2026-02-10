"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FolderPickerProps {
  onPhotosSelected: (files: File[]) => void;
}

export function FolderPicker({ onPhotosSelected }: FolderPickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportsDirectoryPicker =
    typeof window !== "undefined" && "showDirectoryPicker" in window;

  const handleDirectoryPicker = useCallback(async () => {
    if (!supportsDirectoryPicker) return;
    setIsLoading(true);
    try {
      const dirHandle = await (
        window as unknown as {
          showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
        }
      ).showDirectoryPicker();
      const files: File[] = [];
      for await (const entry of dirHandle.values()) {
        if (entry.kind === "file") {
          const file = await entry.getFile();
          files.push(file);
        }
      }
      if (files.length > 0) {
        onPhotosSelected(files);
      }
    } catch (err) {
      // User cancelled the picker
      if ((err as Error).name !== "AbortError") {
        console.error("Error reading directory:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [supportsDirectoryPicker, onPhotosSelected]);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;
      setIsLoading(true);
      const files = Array.from(fileList);
      onPhotosSelected(files);
      setIsLoading(false);
    },
    [onPhotosSelected]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const items = e.dataTransfer.items;
      if (!items) return;

      setIsLoading(true);
      const files: File[] = [];

      // Try to read directories recursively via webkitGetAsEntry
      const readEntry = async (entry: FileSystemEntry): Promise<void> => {
        if (entry.isFile) {
          const fileEntry = entry as FileSystemFileEntry;
          const file = await new Promise<File>((resolve, reject) =>
            fileEntry.file(resolve, reject)
          );
          files.push(file);
        } else if (entry.isDirectory) {
          const dirEntry = entry as FileSystemDirectoryEntry;
          const reader = dirEntry.createReader();
          const entries = await new Promise<FileSystemEntry[]>(
            (resolve, reject) => reader.readEntries(resolve, reject)
          );
          for (const childEntry of entries) {
            await readEntry(childEntry);
          }
        }
      };

      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.();
        if (entry) {
          await readEntry(entry);
        } else if (items[i].kind === "file") {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        onPhotosSelected(files);
      }
      setIsLoading(false);
    },
    [onPhotosSelected]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-8 max-w-md w-full"
      >
        {/* Logo / Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10">
            <ImageIcon className="size-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">SortPhoto</h1>
          <p className="text-muted-foreground text-balance">
            Swipe through your photos to quickly sort them into keep and discard
            piles. Works entirely in your browser — nothing gets uploaded.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            w-full rounded-2xl border-2 border-dashed p-10 flex flex-col items-center gap-5
            transition-colors duration-200
            ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/40"
            }
          `}
        >
          <Upload
            className={`size-10 transition-colors ${
              dragOver ? "text-primary" : "text-muted-foreground/50"
            }`}
          />

          <div className="flex flex-col items-center gap-2 text-center">
            <p className="font-medium text-sm">
              Drag &amp; drop photos or a folder here
            </p>
            <p className="text-muted-foreground text-xs">
              or choose an option below
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {/* Open Folder — native File System Access API (Chrome/Edge) */}
            {supportsDirectoryPicker ? (
              <Button
                onClick={handleDirectoryPicker}
                disabled={isLoading}
                className="flex-1"
                size="lg"
              >
                <FolderOpen className="size-4" />
                Open Folder
              </Button>
            ) : (
              /* Fallback folder picker using webkitdirectory */
              <Button
                onClick={() => folderInputRef.current?.click()}
                disabled={isLoading}
                className="flex-1"
                size="lg"
              >
                <FolderOpen className="size-4" />
                Open Folder
              </Button>
            )}

            {/* Select individual files */}
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <ImageIcon className="size-4" />
              Select Files
            </Button>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={folderInputRef}
          type="file"
          multiple
          // @ts-expect-error webkitdirectory is not in the standard types
          webkitdirectory=""
          onChange={handleFileInput}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />

        {/* Hint */}
        <div className="text-xs text-muted-foreground/60 text-center space-y-1">
          <p>Supports JPG, PNG, WEBP, GIF, AVIF, and more</p>
        </div>
      </motion.div>
    </div>
  );
}
