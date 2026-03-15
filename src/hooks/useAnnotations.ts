import { useState, useCallback } from 'react';

export interface Highlight {
  id: string;
  text: string;
  color: string;
  chunkIndex: number;
  createdAt: Date;
}

export interface Annotation {
  id: string;
  text: string;
  note: string;
  chunkIndex: number;
  createdAt: Date;
}

export interface Bookmark {
  id: string;
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  bookTitle: string;
  createdAt: Date;
}

const HIGHLIGHT_COLORS = [
  'hsl(48 96% 70%)',   // Yellow
  'hsl(142 72% 70%)',  // Green
  'hsl(199 89% 70%)',  // Blue
  'hsl(330 80% 75%)',  // Pink
  'hsl(280 60% 75%)',  // Purple
];

export function useAnnotations() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [activeHighlightColor, setActiveHighlightColor] = useState(HIGHLIGHT_COLORS[0]);

  const addHighlight = useCallback((text: string, chunkIndex: number) => {
    const highlight: Highlight = {
      id: `hl-${Date.now()}`,
      text,
      color: activeHighlightColor,
      chunkIndex,
      createdAt: new Date(),
    };
    setHighlights(prev => [...prev, highlight]);
    return highlight;
  }, [activeHighlightColor]);

  const removeHighlight = useCallback((id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
  }, []);

  const addAnnotation = useCallback((text: string, note: string, chunkIndex: number) => {
    const annotation: Annotation = {
      id: `an-${Date.now()}`,
      text,
      note,
      chunkIndex,
      createdAt: new Date(),
    };
    setAnnotations(prev => [...prev, annotation]);
    return annotation;
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  }, []);

  const toggleBookmark = useCallback((bookId: string, chapterId: string, chapterTitle: string, bookTitle: string) => {
    const existing = bookmarks.find(b => b.bookId === bookId && b.chapterId === chapterId);
    if (existing) {
      setBookmarks(prev => prev.filter(b => b.id !== existing.id));
      return null;
    }
    const bookmark: Bookmark = {
      id: `bm-${Date.now()}`,
      bookId,
      chapterId,
      chapterTitle,
      bookTitle,
      createdAt: new Date(),
    };
    setBookmarks(prev => [...prev, bookmark]);
    return bookmark;
  }, [bookmarks]);

  const isBookmarked = useCallback((bookId: string, chapterId: string) => {
    return bookmarks.some(b => b.bookId === bookId && b.chapterId === chapterId);
  }, [bookmarks]);

  return {
    highlights,
    annotations,
    bookmarks,
    activeHighlightColor,
    highlightColors: HIGHLIGHT_COLORS,
    setActiveHighlightColor,
    addHighlight,
    removeHighlight,
    addAnnotation,
    removeAnnotation,
    toggleBookmark,
    isBookmarked,
  };
}
