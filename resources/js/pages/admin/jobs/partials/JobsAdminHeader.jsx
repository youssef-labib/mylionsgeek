import StatsCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { Briefcase, Eye, EyeOff, ExternalLink, Plus } from 'lucide-react';
import { useMemo } from 'react';

export default function JobsAdminHeader({ filteredJobs, onOpenCreateJob = () => {} }) {
    const statsData = useMemo(() => {
        const total = filteredJobs.length;
        const published = filteredJobs.filter((j) => j.is_published).length;
        const draft = total - published;
        return [
            { title: 'Total job postings', value: total, icon: Briefcase },
            { title: 'Published', value: published, icon: Eye },
            { title: 'Unpublished', value: draft, icon: EyeOff },
        ];
    }, [filteredJobs]);

    return (
        <>
            <StatsCard statsData={statsData} />
            <div className="flex flex-wrap items-center justify-end gap-3">
                <Button type="button" onClick={onOpenCreateJob} className="gap-2 bg-alpha text-black hover:bg-alpha/90">
                    <Plus className="h-4 w-4" />
                    Create job
                </Button>
                <Button
                    asChild
                    className="cursor-pointer border border-[var(--color-alpha)] bg-transparent px-6 py-4 text-[var(--color-alpha)] hover:bg-[var(--color-alpha)] hover:text-black"
                >
                    <Link href="/students/jobs" className="inline-flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Student job board
                    </Link>
                </Button>
            </div>
        </>
    );
}
