import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ClipboardList, CalendarDays, Briefcase } from 'lucide-react';

function formatDateTime(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

export default function RecruiterDashboard({ stats, upcomingInterviews }) {
    const byStatus = stats?.by_status ?? {};
    const chartData = Object.entries(byStatus).map(([name, value]) => ({
        name,
        value: Number(value),
    }));

    return (
        <AppLayout>
            <Head title="Recruiter dashboard" />
            <div className="flex flex-col gap-8 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-beta dark:text-light">Dashboard</h1>
                        <p className="mt-1 text-sm text-beta/70 dark:text-light/70">Applications overview and upcoming interviews.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/recruiter/applications" className="gap-2">
                                <ClipboardList className="h-4 w-4" />
                                Applications
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/recruiter/interviews" className="gap-2">
                                <CalendarDays className="h-4 w-4" />
                                Interview calendar
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/recruiter/jobs" className="gap-2">
                                <Briefcase className="h-4 w-4" />
                                Assigned jobs
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-alpha/15 bg-white p-5 dark:border-light/10 dark:bg-dark_gray">
                        <p className="text-sm text-muted-foreground">Total applications</p>
                        <p className="mt-2 text-3xl font-bold text-beta dark:text-light">{stats?.total_applications ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-alpha/15 bg-white p-5 dark:border-light/10 dark:bg-dark_gray">
                        <p className="text-sm text-muted-foreground">This month</p>
                        <p className="mt-2 text-3xl font-bold text-beta dark:text-light">{stats?.applications_this_month ?? 0}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Last month: {stats?.applications_last_month ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-alpha/15 bg-white p-5 dark:border-light/10 dark:bg-dark_gray">
                        <p className="text-sm text-muted-foreground">Interviews this week</p>
                        <p className="mt-2 text-3xl font-bold text-beta dark:text-light">{stats?.interviews_this_week ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-alpha/15 bg-white p-5 dark:border-light/10 dark:bg-dark_gray">
                        <p className="text-sm text-muted-foreground">Status mix</p>
                        <p className="mt-2 text-sm text-beta/80 dark:text-light/80">
                            {chartData.length === 0 ? 'No data yet' : chartData.map((r) => `${r.name}: ${r.value}`).join(' · ')}
                        </p>
                    </div>
                </div>

                {chartData.length > 0 && (
                    <div className="rounded-lg border border-alpha/15 bg-white p-6 dark:border-light/10 dark:bg-dark_gray">
                        <h2 className="mb-4 text-lg font-semibold text-beta dark:text-light">Applications by status</h2>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 8 }}
                                        formatter={(value) => [value, 'Applications']}
                                    />
                                    <Bar dataKey="value" fill="var(--color-alpha)" radius={[6, 6, 0, 0]} name="Applications" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="rounded-lg border border-alpha/15 bg-white p-6 dark:border-light/10 dark:bg-dark_gray">
                    <div className="mb-4 flex items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold text-beta dark:text-light">Upcoming interviews</h2>
                        <Button variant="link" className="text-alpha" asChild>
                            <Link href="/recruiter/interviews">Manage calendar</Link>
                        </Button>
                    </div>
                    {(upcomingInterviews ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No upcoming interviews. Schedule some in the interview calendar.</p>
                    ) : (
                        <ul className="divide-y divide-alpha/10 dark:divide-light/10">
                            {upcomingInterviews.map((row) => (
                                <li key={row.id} className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0">
                                    <div>
                                        <p className="font-medium text-beta dark:text-light">{row.title}</p>
                                        {row.group_label && (
                                            <p className="text-xs text-alpha dark:text-alpha">Group: {row.group_label}</p>
                                        )}
                                        <p className="text-sm text-muted-foreground">{formatDateTime(row.starts_at)}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
