import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCw, Search } from 'lucide-react';

export default function JobsAdminFilter({ filters, setFilters, jobTypes, initialFilters }) {
    const handleChange = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <div className="relative lg:col-span-2">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                    type="text"
                    placeholder="Search by title or reference"
                    className="bg-[#e5e5e5] pl-10 text-[#0a0a0a] placeholder-[#0a0a0a]/50 dark:bg-[#262626] dark:text-white dark:placeholder-white"
                    value={filters.search}
                    onChange={(e) => handleChange('search', e.target.value)}
                />
            </div>

            <Select value={filters.published} onValueChange={(v) => handleChange('published', v)}>
                <SelectTrigger className="bg-[#e5e5e5] text-[#0a0a0a] data-[placeholder]:text-[#0a0a0a]/50 dark:bg-[#262626] dark:text-white dark:data-[placeholder]:text-white">
                    <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent className="bg-[#e5e5e5] text-[#0a0a0a] dark:bg-[#262626] dark:text-white">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="published">Published only</SelectItem>
                    <SelectItem value="draft">Unpublished only</SelectItem>
                </SelectContent>
            </Select>

            <Select value={filters.job_type || 'all'} onValueChange={(v) => handleChange('job_type', v === 'all' ? '' : v)}>
                <SelectTrigger className="bg-[#e5e5e5] text-[#0a0a0a] data-[placeholder]:text-[#0a0a0a]/50 dark:bg-[#262626] dark:text-white dark:data-[placeholder]:text-white">
                    <SelectValue placeholder="Job type" />
                </SelectTrigger>
                <SelectContent className="bg-[#e5e5e5] text-[#0a0a0a] dark:bg-[#262626] dark:text-white">
                    <SelectItem value="all">All types</SelectItem>
                    {jobTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                            {t}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="flex items-center justify-end lg:col-span-2">
                <Button
                    type="button"
                    variant="outline"
                    className="flex w-full cursor-pointer items-center gap-2 border-[var(--color-alpha)] text-[var(--color-alpha)] hover:bg-[var(--color-alpha)] hover:text-black lg:w-auto"
                    onClick={() => setFilters(initialFilters)}
                >
                    <RotateCw className="h-4 w-4" />
                    Reset filters
                </Button>
            </div>
        </div>
    );
}
