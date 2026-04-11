import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import { Calendar, MapPin } from 'lucide-react';
import { formatJobTypeLabel } from './jobHelpers';

export default function JobListCard({ job }) {
    return (
        <Link
            href={`/students/jobs/${job.id}`}
            className="block rounded-lg border border-alpha/15 bg-white p-5 shadow-sm transition hover:border-alpha/40 hover:shadow-md dark:border-light/10 dark:bg-dark_gray dark:hover:border-light/25"
        >
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <p className="text-xs font-medium text-alpha dark:text-alpha">{job.reference}</p>
                    <h3 className="mt-1 text-lg font-semibold text-beta dark:text-light">{job.title}</h3>
                </div>
                <Badge variant="secondary" className="bg-alpha/15 text-black dark:bg-alpha/25 dark:text-black">
                    {formatJobTypeLabel(job.job_type)}
                </Badge>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-beta/80 dark:text-light/80">{job.excerpt}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-beta/70 dark:text-light/70">
                {job.location && (
                    <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                    </span>
                )}
                {job.deadline && (
                    <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Apply by {job.deadline}
                    </span>
                )}
            </div>
            {job.skills?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.skills.slice(0, 6).map((s) => (
                        <Badge
                            key={s}
                            variant="outline"
                            className="border-alpha/30 text-xs font-normal text-beta dark:border-light/20 dark:text-light"
                        >
                            {s}
                        </Badge>
                    ))}
                    {job.skills.length > 6 && (
                        <span className="self-center text-xs text-beta/60 dark:text-light/60">+{job.skills.length - 6} more</span>
                    )}
                </div>
            )}
        </Link>
    );
}
