import React, { useState, useCallback } from 'react';
import { Search, X, Sparkles, BookOpen, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase, supabaseFunctions } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIBookSearchProps {
  bookTitle: string;
  bookAuthor: string;
  totalPages: number;
  currentPage: number;
  getPagesText: (pages: number[]) => Promise<string>;
  onJumpToPage?: (page: number, searchQuery?: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  found: boolean;
  answer: string;
  quotes: string[];
  pages: number[];
  confidence: number;
}

const AIBookSearch: React.FC<AIBookSearchProps> = ({
  bookTitle,
  bookAuthor,
  totalPages,
  currentPage,
  getPagesText,
  onJumpToPage,
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [showQuotes, setShowQuotes] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setResult(null);

    try {
      // Extract text in small batches to avoid freezing the browser
      const BATCH_SIZE = 15;
      const MAX_TEXT_LENGTH = 60000; // limit total text to avoid huge payloads
      let bookText = '';
      let foundEnough = false;

      for (let batchStart = 1; batchStart <= totalPages && !foundEnough; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalPages);
        const pagesToExtract: number[] = [];
        for (let i = batchStart; i <= batchEnd; i++) {
          pagesToExtract.push(i);
        }

        const batchText = await getPagesText(pagesToExtract);
        bookText += batchText;

        // Stop if we have enough text
        if (bookText.length >= MAX_TEXT_LENGTH) {
          foundEnough = true;
        }

        // Yield to the main thread between batches to prevent freezing
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      if (!bookText || bookText.trim().length < 20) {
        toast.error('لم يتم العثور على نص كافٍ في الصفحات الحالية');
        setIsSearching(false);
        return;
      }

      // Trim text if too large
      if (bookText.length > MAX_TEXT_LENGTH) {
        bookText = bookText.substring(0, MAX_TEXT_LENGTH);
      }

      const { data, error } = await supabaseFunctions.functions.invoke('smart-book-search', {
        body: { query: query.trim(), bookText, bookTitle, bookAuthor },
      });

      if (error) throw error;
      setResult(data as SearchResult);
    } catch (err) {
      console.error('AI search error:', err);
      toast.error('حدث خطأ أثناء البحث');
    } finally {
      setIsSearching(false);
    }
  }, [query, currentPage, totalPages, getPagesText, bookTitle, bookAuthor]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 left-4 z-50 w-[calc(100vw-2rem)] max-w-sm" dir="rtl">
      <div className="bg-background/95 backdrop-blur-md rounded-2xl shadow-xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b border-border/30">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground font-cairo">البحث الذكي</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { onClose(); setResult(null); setQuery(''); }}
            className="mr-auto h-7 w-7 p-0 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="p-3 flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ابحث عن كلمة أو جملة في الكتاب..."
            className="text-sm font-cairo rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
            autoFocus
            disabled={isSearching}
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            size="sm"
            className="rounded-xl px-3 shrink-0"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="px-3 pb-3 max-h-[50vh] overflow-y-auto">
            {result.found ? (
              <div className="space-y-2">
                {/* Answer */}
                <div className="bg-primary/5 rounded-xl p-3">
                  <p className="text-sm text-foreground font-cairo leading-relaxed whitespace-pre-wrap">
                    {result.answer}
                  </p>
                </div>

                {/* Pages */}
                {result.pages && result.pages.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {result.pages.map((page) => (
                      <Button
                        key={page}
                        variant="outline"
                        size="sm"
                        onClick={() => onJumpToPage?.(page, query.trim())}
                        className="h-7 text-xs rounded-lg font-cairo gap-1"
                      >
                        <BookOpen className="h-3 w-3" />
                        صفحة {page}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Quotes toggle */}
                {result.quotes && result.quotes.length > 0 && (
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQuotes(!showQuotes)}
                      className="text-xs text-muted-foreground font-cairo h-7 gap-1"
                    >
                      {showQuotes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      اقتباسات ({result.quotes.length})
                    </Button>
                    {showQuotes && (
                      <div className="space-y-1.5 mt-1">
                        {result.quotes.map((q, i) => (
                          <div key={i} className="bg-muted/50 rounded-lg p-2 border-r-2 border-primary/50">
                            <p className="text-xs text-muted-foreground font-cairo leading-relaxed">"{q}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Confidence */}
                {result.confidence && (
                  <p className="text-[10px] text-muted-foreground/60 font-cairo text-left">
                    دقة: {Math.round(result.confidence * 100)}%
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-cairo">
                  {result.answer || 'لم يتم العثور على نتائج في الصفحات المحملة'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Searching state */}
        {isSearching && (
          <div className="px-3 pb-3">
            <div className="flex items-center justify-center gap-2 py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-cairo">جاري البحث بالذكاء الاصطناعي...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIBookSearch;
