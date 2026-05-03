"use client";

import { useState, useCallback } from "react";

export function useDragReorder(initialItems: string[]): {
  items: string[];
  dragHandlers: (index: number) => {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnd: () => void;
  };
  dragOverIndex: number | null;
} {
  const [items, setItems] = useState(initialItems);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const dragHandlers = useCallback((index: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
      (e.target as HTMLElement).style.opacity = "0.5";
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverIndex(index);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === index) return;
      setItems(prev => {
        const next = [...prev];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(index, 0, moved);
        try { localStorage.setItem("ftp-tile-order", JSON.stringify(next)); } catch {}
        return next;
      });
      setDragIndex(null);
      setDragOverIndex(null);
    },
    onDragEnd: () => {
      setDragIndex(null);
      setDragOverIndex(null);
      document.querySelectorAll("[draggable]").forEach(el => {
        (el as HTMLElement).style.opacity = "1";
      });
    },
  }), [dragIndex]);

  return { items, dragHandlers, dragOverIndex };
}

export function getSavedOrder(sectionId: string, defaultTiles: string[]): string[] {
  if (typeof window === "undefined") return defaultTiles;
  try {
    const saved = localStorage.getItem(`ftp-tile-order-${sectionId}`);
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      if (parsed.length === defaultTiles.length && parsed.every(t => defaultTiles.includes(t))) {
        return parsed;
      }
    }
  } catch {}
  return defaultTiles;
}

export function saveTileOrder(sectionId: string, tiles: string[]) {
  try { localStorage.setItem(`ftp-tile-order-${sectionId}`, JSON.stringify(tiles)); } catch {}
}
