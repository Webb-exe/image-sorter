"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Download,
  FileText,
  Archive,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { PhotoFile } from "@/hooks/use-photo-store";

interface ResultsSummaryProps {
  photos: PhotoFile[];
  kept: number[];
  discarded: number[];
  onStartOver: () => void;
}

export function ResultsSummary({
  photos,
  kept,
  discarded,
  onStartOver,
}: ResultsSummaryProps) {
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const keptPhotos = kept.map((i) => photos[i]);
  const discardedPhotos = discarded.map((i) => photos[i]);
  const total = photos.length;
  const keepPercent = total > 0 ? Math.round((kept.length / total) * 100) : 0;

  const downloadList = useCallback(
    (list: PhotoFile[], filename: string) => {
      const content = list.map((p) => p.name).join("\n");
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    []
  );

  const downloadKeptZip = useCallback(async () => {
    setIsZipping(true);
    setZipProgress(0);

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      for (let i = 0; i < keptPhotos.length; i++) {
        const photo = keptPhotos[i];
        const arrayBuffer = await photo.file.arrayBuffer();
        zip.file(photo.name, arrayBuffer);
        setZipProgress(Math.round(((i + 1) / keptPhotos.length) * 100));
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kept-photos.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error creating zip:", err);
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  }, [keptPhotos]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center gap-8 max-w-md w-full"
      >
        {/* Header */}
        <motion.div
          variants={item}
          className="flex flex-col items-center gap-3 text-center"
        >
          <div className="flex items-center justify-center size-16 rounded-2xl bg-green-500/10">
            <Check className="size-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">All Done!</h1>
          <p className="text-muted-foreground text-balance">
            You sorted through all {total} photos. Here&apos;s the breakdown.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={item}
          className="grid grid-cols-2 gap-4 w-full"
        >
          <div className="flex flex-col items-center gap-2 p-5 rounded-2xl border bg-card">
            <div className="flex items-center gap-2 text-green-500">
              <Check className="size-5" strokeWidth={2.5} />
              <span className="text-2xl font-bold tabular-nums">
                {kept.length}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">Kept</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-5 rounded-2xl border bg-card">
            <div className="flex items-center gap-2 text-red-500">
              <X className="size-5" strokeWidth={2.5} />
              <span className="text-2xl font-bold tabular-nums">
                {discarded.length}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">Discarded</span>
          </div>
        </motion.div>

        {/* Keep Rate Bar */}
        <motion.div variants={item} className="w-full space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Keep rate</span>
            <span className="tabular-nums font-medium">{keepPercent}%</span>
          </div>
          <div className="h-3 rounded-full bg-red-100 dark:bg-red-950 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${keepPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Download Actions */}
        <motion.div
          variants={item}
          className="flex flex-col gap-3 w-full"
        >
          {kept.length > 0 && (
            <Button
              onClick={downloadKeptZip}
              disabled={isZipping}
              size="lg"
              className="w-full"
            >
              {isZipping ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Zipping... {zipProgress}%
                </>
              ) : (
                <>
                  <Archive className="size-4" />
                  Download Kept Photos (.zip)
                </>
              )}
            </Button>
          )}

          {isZipping && (
            <Progress value={zipProgress} className="h-1.5" />
          )}

          <div className="flex gap-3">
            {kept.length > 0 && (
              <Button
                onClick={() => downloadList(keptPhotos, "kept-photos.txt")}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <FileText className="size-4" />
                Keep List
              </Button>
            )}
            {discarded.length > 0 && (
              <Button
                onClick={() =>
                  downloadList(discardedPhotos, "discarded-photos.txt")
                }
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <Download className="size-4" />
                Discard List
              </Button>
            )}
          </div>
        </motion.div>

        {/* Start Over */}
        <motion.div variants={item}>
          <Button onClick={onStartOver} variant="ghost" size="lg">
            <RotateCcw className="size-4" />
            Start Over
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
