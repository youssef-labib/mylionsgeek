import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { formatJobTypeLabel } from './jobHelpers';

export default function JobShow({ job }) {
    return (
        <AppLayout>
            <Head title={job?.title ? `${job.title} · Jobs` : 'Job'} />
            <div className="z-30 dark:bg-dark">
                <div className="min-h-screen bg-transparent">
                    <div className="mx-auto max-w-3xl px-4 py-6">
                        <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1 text-alpha" asChild>
                            <Link href="/students/jobs">
                                <ArrowLeft className="h-4 w-4" />
                                All jobs
                            </Link>
                        </Button>

                        <article className="rounded-lg border border-alpha/15 bg-white p-6 shadow-sm dark:border-light/10 dark:bg-dark_gray">
                            <p className="text-sm font-medium text-alpha dark:text-alpha">{job.reference}</p>
                            <h1 className="mt-2 text-2xl font-bold text-beta dark:text-light">{job.title}</h1>

                            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-beta/75 dark:text-light/75">
                                <Badge className="bg-alpha/15 text-beta dark:bg-alpha/25 dark:text-light">{formatJobTypeLabel(job.job_type)}</Badge>
                                {job.location && (
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {job.location}
                                    </span>
                                )}
                                {job.deadline && (
                                    <span className="inline-flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        Apply by {job.deadline}
                                    </span>
                                )}
                            </div>

                            {job.skills?.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {job.skills.map((s) => (
                                        <Badge
                                            key={s}
                                            variant="outline"
                                            className="border-alpha/30 font-normal text-beta dark:border-light/20 dark:text-light"
                                        >
                                            {s}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <div className="prose prose-sm mt-6 max-w-none text-beta dark:prose-invert dark:text-light">
                                <p className="whitespace-pre-wrap text-beta/90 dark:text-light/90">{job.description}</p>
                            </div>
                        </article>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
