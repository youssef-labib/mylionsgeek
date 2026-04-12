import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, MapPin, Send } from 'lucide-react';
import { useState } from 'react';
import { formatJobTypeLabel } from './jobHelpers';

export default function JobShow({ job }) {
    const { flash } = usePage().props;

    const [applyOpen, setApplyOpen] = useState(false);
    const [cvInputKey, setCvInputKey] = useState(0);

    const { data, setData, post, processing, errors, reset } = useForm({
        subject: '',
        cover_letter: '',
        cv: null,
    });

    const submitApply = (e) => {
        e.preventDefault();
        post(`/students/jobs/${job.id}/apply`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                reset();
                setApplyOpen(false);
                setCvInputKey((k) => k + 1);
            },
        });
    };

    const handleApplyDialogChange = (open) => {
        setApplyOpen(open);
        if (open) {
            setCvInputKey((k) => k + 1);
        }
    };

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

                        {flash?.success && (
                            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
                                {flash.success}
                            </div>
                        )}
                        {flash?.error && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                                {flash.error}
                            </div>
                        )}

                        <article className="rounded-lg border border-alpha/15 bg-white p-6 shadow-sm dark:border-light/10 dark:bg-dark_gray">
                            <p className="text-sm font-medium text-alpha dark:text-alpha">{job.reference}</p>
                            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <h1 className="text-2xl font-bold text-beta dark:text-light">{job.title}</h1>
                                {(job.has_applied || job.can_apply) && (
                                    <div className="shrink-0">
                                        {job.has_applied ? (
                                            <Badge className="bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100">
                                                Applied
                                            </Badge>
                                        ) : (
                                            <Button
                                                type="button"
                                                onClick={() => setApplyOpen(true)}
                                                className="bg-alpha text-black hover:bg-alpha/90"
                                            >
                                                <Send className="mr-2 h-4 w-4" />
                                                Apply
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-beta/75 dark:text-light/75">
                                <Badge className="bg-alpha/15 text-black dark:bg-alpha/25 dark:text-black">{formatJobTypeLabel(job.job_type)}</Badge>
                                {job.location && (
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {job.location}
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

                            {job.can_apply && (
                                <div className="mt-8 border-t border-alpha/10 pt-6 dark:border-light/10">
                                    <p className="mb-3 text-sm text-beta/80 dark:text-light/80">
                                        Interested in this role? Submit your application with a short subject, description, and CV.
                                    </p>
                                    <Button
                                        type="button"
                                        onClick={() => setApplyOpen(true)}
                                        className="bg-alpha text-black hover:bg-alpha/90"
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        Open application
                                    </Button>
                                </div>
                            )}

                            {job.is_owner && job.manage && (
                                <div className="mt-8 rounded-md border border-alpha/20 bg-alpha/5 p-4 dark:border-light/15">
                                    <p className="text-sm font-medium text-beta dark:text-light">You manage this posting.</p>
                                    <Button className="mt-3 bg-alpha text-black hover:bg-alpha/90" size="sm" asChild>
                                        <Link href={job.manage.href}>{job.manage.label}</Link>
                                    </Button>
                                </div>
                            )}
                        </article>

                        <Dialog open={applyOpen} onOpenChange={handleApplyDialogChange}>
                            <DialogContent className="max-h-[90vh] overflow-y-auto border-alpha/15 bg-light dark:border-light/10 dark:bg-dark sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle className="text-beta dark:text-light">Apply — {job.title}</DialogTitle>
                                </DialogHeader>
                                <form id="job-apply-form" onSubmit={submitApply} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="apply-subject" className="text-beta dark:text-light">
                                            Subject
                                        </Label>
                                        <Input
                                            id="apply-subject"
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                            placeholder="Short title for your application"
                                            className="border-alpha/30 dark:border-light/15"
                                        />
                                        {errors.subject && <p className="text-sm text-red-600">{errors.subject}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="apply-description" className="text-beta dark:text-light">
                                            Description
                                        </Label>
                                        <Textarea
                                            id="apply-description"
                                            value={data.cover_letter}
                                            onChange={(e) => setData('cover_letter', e.target.value)}
                                            placeholder="Introduce yourself and why you fit this role"
                                            rows={5}
                                            className="border-alpha/30 dark:border-light/15"
                                        />
                                        {errors.cover_letter && <p className="text-sm text-red-600">{errors.cover_letter}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="apply-cv" className="text-beta dark:text-light">
                                            CV (PDF or Word)
                                        </Label>
                                        <Input
                                            key={cvInputKey}
                                            id="apply-cv"
                                            type="file"
                                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            className="cursor-pointer border-alpha/30 dark:border-light/15"
                                            onChange={(e) => setData('cv', e.target.files?.[0] ?? null)}
                                        />
                                        {errors.cv && <p className="text-sm text-red-600">{errors.cv}</p>}
                                    </div>
                                </form>
                                <DialogFooter className="gap-2 sm:gap-0">
                                    <Button type="button" variant="outline" onClick={() => setApplyOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        form="job-apply-form"
                                        disabled={processing}
                                        className="bg-alpha text-black hover:bg-alpha/90"
                                    >
                                        {processing ? 'Sending…' : 'Submit application'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
