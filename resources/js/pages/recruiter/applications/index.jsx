import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';

function formatDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

export default function RecruiterApplicationsIndex({ applications }) {
    const list = applications ?? [];

    return (
        <AppLayout>
            <Head title="Applications" />
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold text-beta dark:text-light">Applications</h1>
                    <p className="mt-1 text-sm text-beta/70 dark:text-light/70">Students who applied to your job postings.</p>
                </div>

                {list.length === 0 ? (
                    <div className="rounded-lg border border-alpha/15 bg-white p-10 text-center dark:border-light/10 dark:bg-dark_gray">
                        <p className="text-beta dark:text-light">No applications yet.</p>
                        <p className="mt-2 text-sm text-beta/70 dark:text-light/70">
                            Post a job from{' '}
                            <Link href="/recruiter/jobs" className="font-medium text-alpha underline">
                                My jobs
                            </Link>{' '}
                            and share it with students.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-alpha/15 bg-white shadow-sm dark:border-light/10 dark:bg-dark_gray">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Job</TableHead>
                                    <TableHead>Applicant</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Applied</TableHead>
                                    <TableHead>Cover letter</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {list.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="max-w-[200px]">
                                            <span className="line-clamp-2 font-medium">{row.job?.title ?? '—'}</span>
                                            <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{row.job?.reference}</span>
                                        </TableCell>
                                        <TableCell>
                                            {row.applicant ? (
                                                <div>
                                                    <Link
                                                        href={`/students/${row.applicant.id}`}
                                                        className="font-medium text-alpha hover:underline"
                                                    >
                                                        {row.applicant.name}
                                                    </Link>
                                                    <span className="mt-0.5 block text-xs text-muted-foreground">{row.applicant.email}</span>
                                                </div>
                                            ) : (
                                                '—'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="capitalize">
                                                {row.status ?? 'pending'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-sm">{formatDate(row.created_at)}</TableCell>
                                        <TableCell className="max-w-xs text-sm text-beta/80 dark:text-light/80">
                                            {row.cover_letter ? (
                                                <span className="line-clamp-3 whitespace-pre-wrap">{row.cover_letter}</span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
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
