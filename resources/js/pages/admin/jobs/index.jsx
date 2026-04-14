import Banner from '@/components/banner';
import AppLayout from '@/layouts/app-layout';
import { usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import students from '../../../../../public/assets/images/banner/students.png';
import AdminCreateJobDialog from './partials/AdminCreateJobDialog';
import AdminEditJobDialog from './partials/AdminEditJobDialog';
import JobsAdminFilter from './partials/JobsAdminFilter';
import JobsAdminHeader from './partials/JobsAdminHeader';
import JobsAdminTable from './partials/JobsAdminTable';

const defaultFilters = {
    search: '',
    published: 'all',
    job_type: '',
};

export default function AdminJobsIndex({ jobs, recruiterOptions = [], jobTypeOptions = [] }) {
    const { auth } = usePage().props;
    const [filters, setFilters] = useState(defaultFilters);
    const [createJobOpen, setCreateJobOpen] = useState(false);
    const [jobToEdit, setJobToEdit] = useState(null);

    const jobTypes = useMemo(() => {
        const set = new Set(jobs.map((j) => j.job_type).filter(Boolean));
        return [...set].sort();
    }, [jobs]);

    const filteredJobs = useMemo(() => {
        const q = filters.search.trim().toLowerCase();
        return jobs.filter((job) => {
            if (q) {
                const inTitle = (job.title || '').toLowerCase().includes(q);
                const inRef = (job.reference || '').toLowerCase().includes(q);
                if (!inTitle && !inRef) return false;
            }
            if (filters.published === 'published' && !job.is_published) return false;
            if (filters.published === 'draft' && job.is_published) return false;
            if (filters.job_type && job.job_type !== filters.job_type) return false;
            return true;
        });
    }, [jobs, filters]);

    return (
        <AppLayout>
            <div className="flex flex-col gap-10 p-6">
                <Banner
                    illustration={students}
                    userName={auth?.user?.name ?? ''}
                    title="Job postings"
                    description="Create postings, assign recruiters to each offer, and review what appears on the student job board."
                />
                <JobsAdminHeader filteredJobs={jobs} onOpenCreateJob={() => setCreateJobOpen(true)} />
                <AdminCreateJobDialog
                    open={createJobOpen}
                    onOpenChange={setCreateJobOpen}
                    recruiterOptions={recruiterOptions}
                    jobTypeOptions={jobTypeOptions}
                />
                <AdminEditJobDialog
                    open={jobToEdit !== null}
                    onOpenChange={(next) => {
                        if (!next) {
                            setJobToEdit(null);
                        }
                    }}
                    job={jobToEdit}
                    recruiterOptions={recruiterOptions}
                    jobTypeOptions={jobTypeOptions}
                />
                <JobsAdminFilter
                    filters={filters}
                    setFilters={setFilters}
                    jobTypes={jobTypes}
                    initialFilters={defaultFilters}
                />
                <JobsAdminTable jobs={filteredJobs} onEditJob={setJobToEdit} />
            </div>
        </AppLayout>
    );
}
