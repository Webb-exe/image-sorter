"use client";

import { usePhotoStore } from "@/hooks/use-photo-store";
import { FolderPicker } from "@/components/folder-picker";
import { PhotoSorter } from "@/components/photo-sorter";
import { ResultsSummary } from "@/components/results-summary";

export default function Home() {
  const store = usePhotoStore();

  // Phase: picking photos
  if (store.photos.length === 0) {
    return <FolderPicker onPhotosSelected={store.loadPhotos} />;
  }

  // Phase: all sorted
  if (store.isComplete) {
    return (
      <ResultsSummary
        photos={store.photos}
        kept={store.kept}
        discarded={store.discarded}
        onStartOver={store.reset}
      />
    );
  }

  // Phase: sorting
  return (
    <PhotoSorter
      currentPhoto={store.currentPhoto!}
      currentIndex={store.currentIndex}
      totalPhotos={store.photos.length}
      progress={store.progress}
      canUndo={store.canUndo}
      keptCount={store.kept.length}
      discardedCount={store.discarded.length}
      onKeep={store.keepCurrent}
      onDiscard={store.discardCurrent}
      onUndo={store.undo}
    />
  );
}
