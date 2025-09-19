// src/app/quick-search.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchByTitle } from '@/db/search';
import type { Page } from '@/db/db';
import { debounce } from '@/lib/debounce';
import { cn } from '@/lib/utils';

type QuickSearchProps = {
    onSelect: (pageId: string) => void;
    className?: string;
};

export function QuickSearch({ onSelect, className }: QuickSearchProps) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const [results, setResults] = useState<Page[]>([]);
    const [active, setActive] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    const run = useMemo(
        () =>
            debounce(async (text: string) => {
                const rows = await searchByTitle(text);
                setResults(rows);
                setActive(0);
                setOpen(true);
            }, 200),
        []
    );

    useEffect(() => {
        void run(q);
    }, [q, run]);

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (!open || results.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const hit = results[active];
            if (hit) {
                onSelect(hit.id);
                setOpen(false);
            }
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    }

    function choose(p: Page) {
        onSelect(p.id);
        setOpen(false);
    }

    return (
        <div className={cn('relative w-72', className)}>
            <div className="flex gap-2">
                <Input
                    placeholder="Search pages…"
                    value={q}
                    onChange={(e) => setQ(e.currentTarget.value)}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKeyDown}
                    aria-expanded={open}
                    aria-controls="qc-results"
                />
                <Button
                    variant="outline"
                    onClick={() => {
                        if (results[0]) choose(results[0]);
                    }}
                >
                    Go
                </Button>
            </div>

            {open && results.length > 0 && (
                <div
                    id="qc-results"
                    ref={listRef}
                    role="listbox"
                    className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-md"
                >
                    {results.map((p, i) => (
                        <button
                            key={p.id}
                            role="option"
                            aria-selected={i === active}
                            onMouseEnter={() => setActive(i)}
                            onClick={() => choose(p)}
                            className={cn(
                                'w-full text-left px-3 py-2 text-sm hover:bg-accent',
                                i === active && 'bg-accent'
                            )}
                        >
                            <div className="truncate">
                                {p.title || 'Untitled'}
                            </div>
                        </button>
                    ))}
                </div>
            )}
            {open && results.length === 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                    No results
                </div>
            )}
        </div>
    );
}
