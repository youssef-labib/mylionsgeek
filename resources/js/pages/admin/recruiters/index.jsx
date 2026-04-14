import Banner from '@/components/banner';
import AppLayout from '@/layouts/app-layout';
import { usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import students from '../../../../../public/assets/images/banner/students.png';
import RecruitersFilter from './partials/RecruitersFilter';
import RecruitersHeader from './partials/RecruitersHeader';
import RecruitersTable from './partials/RecruitersTable';

export default function AdminRecruitersIndex({ recruiters }) {
    const { auth, flash } = usePage().props;
    const [search, setSearch] = useState('');

    const filteredRecruiters = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return recruiters;
        return recruiters.filter((r) => {
            return (r.name || '').toLowerCase().includes(q) || (r.email || '').toLowerCase().includes(q);
        });
    }, [recruiters, search]);

    return (
        <AppLayout>
            <div className="flex flex-col gap-10 p-6">
                <Banner
                    illustration={students}
                    userName={auth?.user?.name ?? ''}
                    title="Recruiters"
                    description="Invite hiring partners by email with a secure temporary password, and manage recruiter accounts from one place."
                />

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                        {flash.error}
                    </div>
                )}

                <RecruitersHeader filteredRecruiters={recruiters} />
                <RecruitersFilter search={search} setSearch={setSearch} />
                <RecruitersTable recruiters={filteredRecruiters} />
            </div>
        </AppLayout>
    );
}
