import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import JobPostingForm from '@/pages/admin/jobs/partials/JobPostingForm';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

function buildFormState(job, jobTypeOptions) {
    return {
        title: job.title ?? '',
        description: job.description ?? '',
        location: job.location ?? '',
        job_type: job.job_type ?? jobTypeOptions[0] ?? 'full_time',
        skills: Array.isArray(job.skills) ? job.skills.join(', ') : job.skills ?? '',
        is_published: job.is_published ?? true,
        recruiter_ids: job.recruiter_ids ?? job.recruiters?.map((r) => r.id) ?? [],
    };
}

export default function AdminEditJobDialog({ open, onOpenChange, job, recruiterOptions = [], jobTypeOptions = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        title: '',
        description: '',
        location: '',
        job_type: jobTypeOptions[0] ?? 'full_time',
        skills: '',
        is_published: true,
        recruiter_ids: [],
    });

    useEffect(() => {
        if (!open || !job) {
            return;
        }
        const next = buildFormState(job, jobTypeOptions);
        Object.keys(next).forEach((key) => setData(key, next[key]));
    }, [open, job?.id, jobTypeOptions, setData]);

    const submit = (e) => {
        e.preventDefault();
        if (!job) {
            return;
        }
        put(`/admin/jobs/${job.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
            },
        });
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton
                className="max-h-[min(92vh,56rem)] w-[calc(100%-1.5rem)] max-w-5xl gap-0 overflow-hidden p-0 sm:w-full"
            >
                <div className="max-h-[min(92vh,56rem)] overflow-y-auto p-6">
                    <DialogHeader className="text-left">
                        <DialogTitle className="text-xl">Edit job posting</DialogTitle>
                        <DialogDescription>
                            Update the role, publication status, and recruiter assignments for this posting.
                        </DialogDescription>
                    </DialogHeader>
                    {job && (
                        <JobPostingForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            processing={processing}
                            onSubmit={submit}
                            jobTypeOptions={jobTypeOptions}
                            recruiterOptions={recruiterOptions}
                            onCancel={handleCancel}
                            reference={job.reference}
                            submitLabel="Save changes"
                            embedInModal
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
