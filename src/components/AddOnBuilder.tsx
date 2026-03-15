import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useEnterprise } from '@/context/EnterpriseContext';
import { useBooks } from '@/context/BookContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Crown, Lock, Plus, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddOnBuilderProps {
  collectionId: string;
  collectionBookIds: string[];
}

export function AddOnBuilder({ collectionId, collectionBookIds }: AddOnBuilderProps) {
  const { currentTier, currentEnterprise, logAction } = useEnterprise();
  const { books } = useBooks();
  const { toast } = useToast();
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);

  const isBasicTier = currentTier?.id === 'basic';

  // Get books NOT already in this collection
  const availableTitles = books.filter(b => !collectionBookIds.includes(b.id));

  const toggleTitle = (bookId: string) => {
    setSelectedTitles(prev =>
      prev.includes(bookId) ? prev.filter(id => id !== bookId) : [...prev, bookId]
    );
  };

  const handleRequestAddOn = () => {
    if (selectedTitles.length === 0) return;

    const selectedBooks = availableTitles.filter(b => selectedTitles.includes(b.id));
    logAction(
      'request_addon',
      'collection',
      collectionId,
      `Add-on request: ${selectedTitles.length} titles`,
      {
        requestedTitles: selectedBooks.map(b => ({ id: b.id, title: b.title })),
        count: selectedTitles.length,
        enterpriseId: currentEnterprise?.id,
      }
    );

    toast({
      title: 'Add-On Request Submitted',
      description: `Your request for ${selectedTitles.length} additional title(s) has been submitted to Rittenhouse for review.`,
    });

    setSelectedTitles([]);
  };

  if (isBasicTier) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Card className="mt-6 glass-card border-muted">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Add-On Title Builder</CardTitle>
              <Badge variant="secondary" className="text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Pro Required
              </Badge>
            </div>
            <CardDescription>
              Upgrade to Pro to request additional titles for your collections.
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="mt-6 glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">Add-On Title Builder</CardTitle>
          </div>
          <CardDescription>
            Request additional titles to be added to this collection for your institution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableTitles.length === 0 ? (
            <p className="text-sm text-muted-foreground">All available titles are already in this collection.</p>
          ) : (
            <>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {availableTitles.map(book => (
                  <label
                    key={book.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/5 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedTitles.includes(book.id)}
                      onCheckedChange={() => toggleTitle(book.id)}
                    />
                    <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{book.authors.join(', ')}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedTitles.length} title(s) selected
                </p>
                <Button
                  onClick={handleRequestAddOn}
                  disabled={selectedTitles.length === 0}
                >
                  Request Add-On
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
