import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import { formatJobTypeLabel } from '@/pages/students/Jobs/partials/jobHelpers';

export default function RecruiterJobsIndex({ jobs }) {
    const list = jobs ?? [];

    return (
        <AppLayout>
            <Head title="Assigned job postings" />
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold text-beta dark:text-light">Assigned job postings</h1>
                    <p className="mt-1 text-sm text-beta/70 dark:text-light/70">
                        Offers an admin assigned to you. Open applications from the Applications page.
                    </p>
                </div>

                {list.length === 0 ? (
                    <div className="rounded-lg border border-alpha/15 bg-white p-10 text-center dark:border-light/10 dark:bg-dark_gray">
                        <p className="text-beta dark:text-light">You have no assigned postings yet.</p>
                        <p className="mt-2 text-sm text-muted-foreground">An administrator will assign you when they publish a job.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-alpha/15 bg-white shadow-sm dark:border-light/10 dark:bg-dark_gray">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Applications</TableHead>
                                    <TableHead>Published</TableHead>
                                    <TableHead>Deadline</TableHead>
                                    <TableHead>Public view</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {list.map((job) => (
                                    <TableRow key={job.id}>
                                        <TableCell className="font-mono text-sm font-medium">{job.reference}</TableCell>
                                        <TableCell className="max-w-[220px] font-medium">
                                            <span className="line-clamp-2">{job.title}</span>
                                        </TableCell>
                                        <TableCell>{formatJobTypeLabel(job.job_type)}</TableCell>
                                        <TableCell>{job.applications_count ?? 0}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    job.is_published
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                                                        : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200'
                                                }
                                            >
                                                {job.is_published ? 'Yes' : 'No'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{job.deadline ?? '—'}</TableCell>
                                        <TableCell>
                                            {job.is_published ? (
                                                <Button variant="ghost" size="sm" className="h-8 gap-1 text-alpha" asChild>
                                                    <a href={`/students/jobs/${job.id}`} target="_blank" rel="noreferrer">
                                                        <ExternalLink className="h-4 w-4" />
                                                        View
                                                    </a>
                                                </Button>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
