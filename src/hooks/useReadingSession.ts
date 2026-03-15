import { useState, useEffect, useCallback, useRef } from 'react';

export interface ReadingEvent {
  id: string;
  type: 'page_view' | 'highlight' | 'bookmark' | 'annotation' | 'search' | 'ai_query' | 'time_spent';
  bookId: string;
  chapterId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ReadingStats {
  totalTimeSeconds: number;
  chaptersViewed: number;
  highlightsCreated: number;
  annotationsCreated: number;
  bookmarksCreated: number;
  aiQueriesUsed: number;
  searchesPerformed: number;
}

export function useReadingSession(bookId: string, chapterId: string) {
  const [events, setEvents] = useState<ReadingEvent[]>([]);
  const [stats, setStats] = useState<ReadingStats>({
    totalTimeSeconds: 0,
    chaptersViewed: 1,
    highlightsCreated: 0,
    annotationsCreated: 0,
    bookmarksCreated: 0,
    aiQueriesUsed: 0,
    searchesPerformed: 0,
  });
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalTimeSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
      }));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [bookId, chapterId]);

  const trackEvent = useCallback((type: ReadingEvent['type'], metadata?: Record<string, unknown>) => {
    const event: ReadingEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      bookId,
      chapterId,
      timestamp: new Date(),
      metadata,
    };
    setEvents(prev => [...prev, event]);

    setStats(prev => {
      const updates = { ...prev };
      switch (type) {
        case 'highlight': updates.highlightsCreated++; break;
        case 'annotation': updates.annotationsCreated++; break;
        case 'bookmark': updates.bookmarksCreated++; break;
        case 'ai_query': updates.aiQueriesUsed++; break;
        case 'search': updates.searchesPerformed++; break;
      }
      return updates;
    });

    return event;
  }, [bookId, chapterId]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return { events, stats, trackEvent, formatTime };
}
