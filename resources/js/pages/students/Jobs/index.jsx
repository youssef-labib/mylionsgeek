import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import JobsFilterSidebar from './partials/JobsFilterSidebar';
import JobsList from './partials/JobsList';
import JobsPageHeader from './partials/JobsPageHeader';
import { buildJobsQuery } from './partials/jobHelpers';

export default function JobsIndex({ jobs, filterOptions, appliedFilters }) {
    const [jobType, setJobType] = useState(appliedFilters?.job_type ?? '');
    const [selectedSkills, setSelectedSkills] = useState(appliedFilters?.skills ?? []);

    const filtersSyncKey = JSON.stringify({
        job_type: appliedFilters?.job_type ?? null,
        skills: Array.isArray(appliedFilters?.skills) ? [...appliedFilters.skills].sort() : [],
    });

    useEffect(() => {
        const payload = JSON.parse(filtersSyncKey);
        setJobType(payload.job_type ?? '');
        setSelectedSkills(Array.isArray(payload.skills) ? payload.skills : []);
    }, [filtersSyncKey]);

    const applyFilters = useCallback((nextType, nextSkills) => {
        router.get('/students/jobs', buildJobsQuery(nextType, nextSkills), {
            preserveState: true,
            replace: true,
        });
    }, []);

    const jobTypes = filterOptions?.job_types ?? [];
    const skillsOptions = filterOptions?.skills ?? [];

    const toggleSkill = useCallback(
        (skill, checked) => {
            setSelectedSkills((prev) => {
                const next = checked ? [...prev, skill] : prev.filter((s) => s !== skill);
                applyFilters(jobType, next);
                return next;
            });
        },
        [applyFilters, jobType],
    );

    const onJobTypeChange = useCallback(
        (value) => {
            const next = value === '__all__' ? '' : value;
            setJobType(next);
            applyFilters(next, selectedSkills);
        },
        [applyFilters, selectedSkills],
    );

    const clearFilters = useCallback(() => {
        setJobType('');
        setSelectedSkills([]);
        router.get('/students/jobs', {}, { preserveState: true, replace: true });
    }, []);

    const hasActiveFilters = useMemo(() => Boolean(jobType) || selectedSkills.length > 0, [jobType, selectedSkills]);

    return (
        <AppLayout>
            <Head title="Jobs" />
            <div className="z-30 dark:bg-dark">
                <div className="min-h-screen bg-transparent">
                    <div className="mx-auto max-w-7xl px-4 py-6">
                        <JobsPageHeader />

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                            <JobsFilterSidebar
                                jobTypes={jobTypes}
                                skillsOptions={skillsOptions}
                                jobType={jobType}
                                selectedSkills={selectedSkills}
                                hasActiveFilters={hasActiveFilters}
                                onJobTypeChange={onJobTypeChange}
                                onToggleSkill={toggleSkill}
                                onClearFilters={clearFilters}
                            />
                            <JobsList jobs={jobs} hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters} />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
