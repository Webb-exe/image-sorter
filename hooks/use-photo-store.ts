"use client";

import { useCallback, useReducer, useEffect, useRef } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PhotoFile {
  file: File;
  name: string;
  url: string;
}

export type SwipeDirection = "left" | "right";

interface HistoryEntry {
  action: "keep" | "discard";
  photoIndex: number;
}

interface PhotoState {
  photos: PhotoFile[];
  currentIndex: number;
  kept: number[];
  discarded: number[];
  history: HistoryEntry[];
}

type PhotoAction =
  | { type: "LOAD_PHOTOS"; photos: PhotoFile[] }
  | { type: "KEEP" }
  | { type: "DISCARD" }
  | { type: "UNDO" }
  | { type: "RESET" };

// ── Reducer ──────────────────────────────────────────────────────────────────

const initialState: PhotoState = {
  photos: [],
  currentIndex: 0,
  kept: [],
  discarded: [],
  history: [],
};

function photoReducer(state: PhotoState, action: PhotoAction): PhotoState {
  switch (action.type) {
    case "LOAD_PHOTOS":
      return {
        ...initialState,
        photos: action.photos,
      };

    case "KEEP": {
      if (state.currentIndex >= state.photos.length) return state;
      return {
        ...state,
        kept: [...state.kept, state.currentIndex],
        history: [
          ...state.history,
          { action: "keep", photoIndex: state.currentIndex },
        ],
        currentIndex: state.currentIndex + 1,
      };
    }

    case "DISCARD": {
      if (state.currentIndex >= state.photos.length) return state;
      return {
        ...state,
        discarded: [...state.discarded, state.currentIndex],
        history: [
          ...state.history,
          { action: "discard", photoIndex: state.currentIndex },
        ],
        currentIndex: state.currentIndex + 1,
      };
    }

    case "UNDO": {
      if (state.history.length === 0) return state;
      const lastEntry = state.history[state.history.length - 1];
      return {
        ...state,
        currentIndex: lastEntry.photoIndex,
        kept: state.kept.filter((i) => i !== lastEntry.photoIndex),
        discarded: state.discarded.filter((i) => i !== lastEntry.photoIndex),
        history: state.history.slice(0, -1),
      };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function usePhotoStore() {
  const [state, dispatch] = useReducer(photoReducer, initialState);
  const urlsRef = useRef<string[]>([]);

  // Cleanup object URLs on unmount or when photos change
  useEffect(() => {
    return () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const loadPhotos = useCallback(
    (files: File[]) => {
      // Revoke old URLs
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));

      const imageExtensions = /\.(jpe?g|png|webp|gif|bmp|tiff?|svg|avif|heic|heif)$/i;
      const imageFiles = files.filter(
        (f) => f.type.startsWith("image/") || imageExtensions.test(f.name)
      );

      // Sort by name for predictable order
      imageFiles.sort((a, b) => a.name.localeCompare(b.name));

      const photos: PhotoFile[] = imageFiles.map((file) => {
        const url = URL.createObjectURL(file);
        return { file, name: file.name, url };
      });

      urlsRef.current = photos.map((p) => p.url);
      dispatch({ type: "LOAD_PHOTOS", photos });
    },
    []
  );

  const keepCurrent = useCallback(() => dispatch({ type: "KEEP" }), []);
  const discardCurrent = useCallback(() => dispatch({ type: "DISCARD" }), []);
  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const reset = useCallback(() => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current = [];
    dispatch({ type: "RESET" });
  }, []);

  const isComplete =
    state.photos.length > 0 && state.currentIndex >= state.photos.length;
  const currentPhoto = state.photos[state.currentIndex] ?? null;
  const progress =
    state.photos.length > 0
      ? (state.currentIndex / state.photos.length) * 100
      : 0;
  const canUndo = state.history.length > 0;

  return {
    ...state,
    currentPhoto,
    isComplete,
    progress,
    canUndo,
    loadPhotos,
    keepCurrent,
    discardCurrent,
    undo,
    reset,
  };
}
