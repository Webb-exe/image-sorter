"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Undo2, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SwipeCard, type SwipeCardRef } from "@/components/swipe-card";
import type { PhotoFile } from "@/hooks/use-photo-store";

interface PhotoSorterProps {
  currentPhoto: PhotoFile;
  currentIndex: number;
  totalPhotos: number;
  progress: number;
  canUndo: boolean;
  keptCount: number;
  discardedCount: number;
  onKeep: () => void;
  onDiscard: () => void;
  onUndo: () => void;
}

export function PhotoSorter({
  currentPhoto,
  currentIndex,
  totalPhotos,
  progress,
  canUndo,
  keptCount,
  discardedCount,
  onKeep,
  onDiscard,
  onUndo,
}: PhotoSorterProps) {
  const cardRef = useRef<SwipeCardRef>(null);

  const handleSwipeComplete = useCallback(
    (direction: "left" | "right") => {
      if (direction === "right") {
        onKeep();
      } else {
        onDiscard();
      }
    },
    [onKeep, onDiscard]
  );

  const triggerSwipe = useCallback(
    (direction: "left" | "right") => {
      cardRef.current?.triggerSwipe(direction);
    },
    []
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if a dialog or input is focused
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          triggerSwipe("left");
          break;
        case "ArrowRight":
          e.preventDefault();
          triggerSwipe("right");
          break;
        case "z":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onUndo();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerSwipe, onUndo]);

  return (
    <div className="flex flex-col h-svh w-full overflow-hidden bg-background">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-none px-4 pt-4 pb-2 space-y-3 z-10"
      >
        {/* Progress */}
        <div className="flex items-center gap-3">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap tabular-nums">
            {currentIndex + 1} / {totalPhotos}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-green-500" />
            <span className="tabular-nums">{keptCount}</span> kept
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-red-500" />
            <span className="tabular-nums">{discardedCount}</span> discarded
          </span>
        </div>
      </motion.div>

      {/* ── Card Area ───────────────────────────────────────────────────── */}
      <div className="flex-1 relative min-h-0 bg-muted/30">
        <SwipeCard
          key={currentIndex}
          ref={cardRef}
          photo={currentPhoto}
          onSwipeComplete={handleSwipeComplete}
        />

        {/* File name overlay */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <motion.span
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full truncate max-w-[80%]"
          >
            {currentPhoto.name}
          </motion.span>
        </div>
      </div>

      {/* ── Bottom Controls ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-none px-4 py-4 space-y-3 z-10"
      >
        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          {/* Discard Button */}
          <Button
            onClick={() => triggerSwipe("left")}
            variant="outline"
            size="icon-lg"
            className="rounded-full size-14 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950"
          >
            <ArrowLeft className="size-6" />
          </Button>

          {/* Undo Button */}
          <Button
            onClick={onUndo}
            disabled={!canUndo}
            variant="outline"
            size="icon-lg"
            className="rounded-full size-11"
          >
            <Undo2 className="size-4" />
          </Button>

          {/* Keep Button */}
          <Button
            onClick={() => triggerSwipe("right")}
            variant="outline"
            size="icon-lg"
            className="rounded-full size-14 border-green-200 text-green-500 hover:bg-green-50 hover:text-green-600 hover:border-green-300 dark:border-green-900 dark:hover:bg-green-950"
          >
            <ArrowRight className="size-6" />
          </Button>
        </div>

        {/* Keyboard Hints */}
        <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground/50">
          <Keyboard className="size-3" />
          <span>
            <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">←</kbd>{" "}
            Discard
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">→</kbd>{" "}
            Keep
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">⌘Z</kbd>{" "}
            Undo
          </span>
        </div>
      </motion.div>
    </div>
  );
}
