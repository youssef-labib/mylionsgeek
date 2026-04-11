import JobPostingForm from '@/pages/admin/jobs/partials/JobPostingForm';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function AdminJobCreate({ recruiterOptions = [], jobTypeOptions = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        location: '',
        job_type: jobTypeOptions[0] ?? 'full_time',
        skills: '',
        deadline: '',
        is_published: true,
        recruiter_ids: [],
    });

    const submit = (e) => {
        e.preventDefault();
        post('/admin/jobs');
    };

    return (
        <AppLayout>
            <Head title="Create job posting" />
            <div className="mx-auto max-w-2xl px-4 py-6">
                <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1 text-alpha" asChild>
                    <Link href="/admin/jobs">
                        <ArrowLeft className="h-4 w-4" />
                        Job postings
                    </Link>
                </Button>

                <div className="rounded-lg border border-alpha/15 bg-white p-6 shadow-sm dark:border-light/10 dark:bg-dark_gray">
                    <h1 className="text-xl font-bold text-beta dark:text-light">New job posting</h1>
                    <p className="mt-1 text-sm text-beta/70 dark:text-light/70">
                        Create the role, publish when ready, and assign one or more recruiters to review applicants.
                    </p>

                    <JobPostingForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        onSubmit={submit}
                        jobTypeOptions={jobTypeOptions}
                        recruiterOptions={recruiterOptions}
                        cancelHref="/admin/jobs"
                        submitLabel="Create posting"
                    />
                </div>
            </div>
        </AppLayout>
    );
}
