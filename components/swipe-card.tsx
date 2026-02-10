"use client";

import {
  forwardRef,
  useImperativeHandle,
  useCallback,
  useRef,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "framer-motion";
import { Check, X } from "lucide-react";
import type { PhotoFile } from "@/hooks/use-photo-store";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SwipeCardRef {
  triggerSwipe: (direction: "left" | "right") => Promise<void>;
}

interface SwipeCardProps {
  photo: PhotoFile;
  onSwipeComplete: (direction: "left" | "right") => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 80;
const FLY_OUT_DISTANCE = 600;
const FLY_OUT_ROTATION = 20;

// ── Component ────────────────────────────────────────────────────────────────

const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(
  ({ photo, onSwipeComplete }, ref) => {
    const isAnimatingRef = useRef(false);

    // Motion values for drag interaction
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12]);

    // Overlay opacities based on drag position
    const keepOverlayOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
    const discardOverlayOpacity = useTransform(
      x,
      [-SWIPE_THRESHOLD, 0],
      [1, 0]
    );

    // Background color shift
    const bgColor = useTransform(
      x,
      [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
      [
        "rgba(239, 68, 68, 0.08)",
        "rgba(0, 0, 0, 0)",
        "rgba(34, 197, 94, 0.08)",
      ]
    );

    const flyOut = useCallback(
      async (direction: "left" | "right") => {
        if (isAnimatingRef.current) return;
        isAnimatingRef.current = true;

        const targetX =
          direction === "right" ? FLY_OUT_DISTANCE : -FLY_OUT_DISTANCE;

        await animate(x, targetX, {
          duration: 0.35,
          ease: [0.32, 0.72, 0, 1],
        });

        onSwipeComplete(direction);
      },
      [onSwipeComplete, x]
    );

    useImperativeHandle(
      ref,
      () => ({
        triggerSwipe: flyOut,
      }),
      [flyOut]
    );

    const handleDragEnd = useCallback(
      (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (isAnimatingRef.current) return;

        const offset = info.offset.x;
        const velocity = info.velocity.x;

        // Swipe if past threshold OR if velocity is high enough
        if (offset > SWIPE_THRESHOLD || velocity > 500) {
          flyOut("right");
        } else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
          flyOut("left");
        } else {
          // Snap back
          animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
        }
      },
      [flyOut, x]
    );

    return (
      <motion.div
        className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        style={{ x, rotate, backgroundColor: bgColor }}
        drag="x"
        onDragEnd={handleDragEnd}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Photo */}
        <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt={photo.name}
            className="max-w-full max-h-full object-contain rounded-lg select-none pointer-events-none"
            draggable={false}
          />

          {/* KEEP Overlay */}
          <motion.div
            className="absolute top-8 left-8 sm:top-12 sm:left-12 border-4 border-green-500 rounded-xl px-4 py-2 pointer-events-none"
            style={{ opacity: keepOverlayOpacity }}
          >
            <div className="flex items-center gap-2">
              <Check className="size-8 text-green-500" strokeWidth={3} />
              <span className="text-2xl sm:text-3xl font-bold text-green-500 tracking-wider">
                KEEP
              </span>
            </div>
          </motion.div>

          {/* DISCARD Overlay */}
          <motion.div
            className="absolute top-8 right-8 sm:top-12 sm:right-12 border-4 border-red-500 rounded-xl px-4 py-2 pointer-events-none"
            style={{ opacity: discardOverlayOpacity }}
          >
            <div className="flex items-center gap-2">
              <X className="size-8 text-red-500" strokeWidth={3} />
              <span className="text-2xl sm:text-3xl font-bold text-red-500 tracking-wider">
                NOPE
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }
);

SwipeCard.displayName = "SwipeCard";

export { SwipeCard };
