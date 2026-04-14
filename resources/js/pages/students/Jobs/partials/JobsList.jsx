import JobListCard from './JobListCard';
import JobsEmptyState from './JobsEmptyState';

export default function JobsList({ jobs, hasActiveFilters, onClearFilters }) {
    if (jobs.length === 0) {
        return (
            <div className="space-y-4 lg:col-span-9">
                <JobsEmptyState hasActiveFilters={hasActiveFilters} onClearFilters={onClearFilters} />
            </div>
        );
    }

    return (
        <div className="space-y-4 lg:col-span-9">
            {jobs.map((job) => (
                <JobListCard key={job.id} job={job} />
            ))}
        </div>
    );
}
