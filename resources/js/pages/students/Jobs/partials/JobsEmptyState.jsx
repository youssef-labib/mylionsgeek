import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';

export default function JobsEmptyState({ hasActiveFilters, onClearFilters }) {
    return (
        <div className="rounded-lg border border-dashed border-alpha/30 bg-white p-10 text-center dark:border-light/15 dark:bg-dark_gray">
            <Briefcase className="mx-auto h-10 w-10 text-beta/40 dark:text-light/40" />
            <p className="mt-3 font-medium text-beta dark:text-light">No jobs match these filters</p>
            <p className="mt-1 text-sm text-beta/70 dark:text-light/70">Try clearing filters or check back later.</p>
            {hasActiveFilters && (
                <Button type="button" variant="outline" className="mt-4 border-alpha/40" onClick={onClearFilters}>
                    Clear filters
                </Button>
            )}
        </div>
    );
}
