export function formatJobTypeLabel(value) {
    const map = {
        full_time: 'Full-time',
        internship: 'Internship',
        part_time: 'Part-time',
        contract: 'Contract',
    };
    return map[value] ?? String(value).replace(/_/g, ' ');
}

export function buildJobsQuery(jobType, skills) {
    const q = {};
    if (jobType) {
        q.job_type = jobType;
    }
    if (skills.length) {
        q.skills = skills;
    }
    return q;
}
