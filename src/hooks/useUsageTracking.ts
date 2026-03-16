import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

type UsageEventType = 'search' | 'item_request' | 'chapter_view' | 'access_denied';

interface TrackEventParams {
  eventType: UsageEventType;
  bookId?: string;
  bookTitle?: string;
  metadata?: Record<string, string | number | boolean>;
}

// UUID v4 pattern
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useUsageTracking() {
  const trackUsageEvent = useCallback(async ({
    eventType,
    bookId,
    bookTitle,
    metadata,
  }: TrackEventParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Only pass book_id if it's a real UUID (DB book), otherwise null
      const resolvedBookId = bookId && UUID_RE.test(bookId) ? bookId : null;

      const { error } = await supabase.from('usage_events').insert([{
        event_type: eventType,
        book_id: resolvedBookId,
        book_title: bookTitle || null,
        user_id: user?.id || null,
        metadata: (metadata || {}) as Json,
      }]);

      if (error) {
        console.warn('[UsageTracking] Insert error:', error.message);
      }
    } catch (err) {
      console.warn('[UsageTracking] Failed to track event:', err);
    }
  }, []);

  return { trackUsageEvent };
}
