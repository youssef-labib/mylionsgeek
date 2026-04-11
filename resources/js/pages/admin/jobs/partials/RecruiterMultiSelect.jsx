import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ChevronDown, X } from 'lucide-react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * Multi-select for recruiters: selected names appear above a select-like trigger;
 * the dropdown lists recruiters not yet selected.
 */
export default function RecruiterMultiSelect({ recruiterOptions = [], selectedIds = [], onChange, error }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const [panelWidth, setPanelWidth] = useState(undefined);

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setPanelWidth(el.offsetWidth));
        ro.observe(el);
        setPanelWidth(el.offsetWidth);
        return () => ro.disconnect();
    }, []);

    const selectedSet = useMemo(() => new Set((selectedIds ?? []).map(Number)), [selectedIds]);

    const selectedRecruiters = useMemo(
        () => recruiterOptions.filter((r) => selectedSet.has(Number(r.id))),
        [recruiterOptions, selectedSet],
    );

    const unselectedRecruiters = useMemo(
        () => recruiterOptions.filter((r) => !selectedSet.has(Number(r.id))),
        [recruiterOptions, selectedSet],
    );

    const add = (id) => {
        const n = Number(id);
        if (selectedSet.has(n)) return;
        onChange([...(selectedIds ?? []).map(Number), n]);
    };

    const remove = (id) => {
        const n = Number(id);
        onChange((selectedIds ?? []).map(Number).filter((x) => x !== n));
    };

    return (
        <div className="space-y-3">
            <div>
                <Label className="text-base">Assigned recruiters</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                    They can view applications for this posting. Leave empty if none yet.
                </p>
            </div>

            {recruiterOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recruiter accounts yet — add them under Admin → Recruiters.</p>
            ) : (
                <div ref={containerRef} className="w-full">
                    <div
                        className={cn(
                            'overflow-hidden rounded-md border border-alpha/15 bg-background shadow-xs dark:border-light/10',
                            'focus-within:ring-ring/50 focus-within:ring-[3px]',
                        )}
                    >
                        {selectedRecruiters.length > 0 && (
                            <div className="flex flex-wrap gap-2 border-b border-alpha/15 bg-muted/40 p-3 dark:border-light/10">
                                {selectedRecruiters.map((r) => (
                                    <Badge
                                        key={r.id}
                                        variant="secondary"
                                        className="max-w-full gap-1 py-1 pr-1 pl-2 text-left font-normal"
                                    >
                                        <span className="truncate">{r.name}</span>
                                        <button
                                            type="button"
                                            className="ml-0.5 rounded-sm p-0.5 opacity-70 ring-offset-background hover:opacity-100 focus:ring-2 focus:ring-alpha focus:outline-none"
                                            onClick={() => remove(r.id)}
                                            aria-label={`Remove ${r.name}`}
                                        >
                                            <X className="h-3.5 w-3.5 shrink-0" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <Popover open={open} onOpenChange={setOpen} modal={false}>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className={cn(
                                        'flex h-10 w-full items-center justify-between gap-2 px-3 text-left text-sm',
                                        'outline-none hover:bg-muted/30',
                                        'focus-visible:bg-muted/20',
                                    )}
                                >
                                    <span className="truncate text-muted-foreground">Select recruiters</span>
                                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent
                                align="start"
                                sideOffset={4}
                                style={panelWidth ? { width: panelWidth } : undefined}
                                className="z-[120] max-w-[min(100vw-2rem,32rem)] border-alpha/15 p-0 dark:border-light/10"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                            >
                                <div className="max-h-56 overflow-y-auto p-1">
                                    {unselectedRecruiters.length === 0 ? (
                                        <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                                            All recruiters are already selected.
                                        </p>
                                    ) : (
                                        unselectedRecruiters.map((r) => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                className="flex w-full flex-col items-start rounded-sm px-2 py-2.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                                onClick={() => add(r.id)}
                                            >
                                                <span className="font-medium text-beta dark:text-light">{r.name}</span>
                                                <span className="text-xs text-muted-foreground">{r.email}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}
