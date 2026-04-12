import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Download } from 'lucide-react';

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
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-beta dark:text-light">Applications</h1>
                        <p className="mt-1 text-sm text-beta/70 dark:text-light/70">Students who applied to your job postings.</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/recruiter/dashboard">Dashboard</Link>
                    </Button>
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
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Applied</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="w-[100px]">CV</TableHead>
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
                                                    <span className="font-medium text-beta dark:text-light">{row.applicant.name}</span>
                                                    <span className="mt-0.5 block text-xs text-muted-foreground">{row.applicant.email}</span>
                                                </div>
                                            ) : (
                                                '—'
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-[160px] text-sm font-medium">{row.subject ?? '—'}</TableCell>
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
                                        <TableCell>
                                            {row.has_cv ? (
                                                <Button variant="outline" size="sm" className="gap-1" asChild>
                                                    <a href={`/recruiter/applications/${row.id}/cv`}>
                                                        <Download className="h-3.5 w-3.5" />
                                                        CV
                                                    </a>
                                                </Button>
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
