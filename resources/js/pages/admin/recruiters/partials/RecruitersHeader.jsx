import StatsCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { UserCheck, Users, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import InviteRecruiterDialog from './InviteRecruiterDialog';

export default function RecruitersHeader({ filteredRecruiters }) {
    const [inviteOpen, setInviteOpen] = useState(false);

    const statsData = useMemo(() => {
        const total = filteredRecruiters.length;
        const active = filteredRecruiters.filter((r) => r.account_state === 1).length;
        return [
            { title: 'Total recruiters', value: total, icon: Users },
            { title: 'Active accounts', value: active, icon: UserCheck },
        ];
    }, [filteredRecruiters]);

    return (
        <>
            <StatsCard statsData={statsData} />
            <div className="flex items-center justify-end gap-3">
                <Button
                    type="button"
                    className="cursor-pointer border border-[var(--color-alpha)] bg-[var(--color-alpha)] px-7 py-4 text-black hover:bg-transparent hover:text-[var(--color-alpha)]"
                    onClick={() => setInviteOpen(true)}
                >
                    <UserPlus className="mr-2 inline h-4 w-4" />
                    Invite recruiter
                </Button>
            </div>
            <InviteRecruiterDialog open={inviteOpen} setOpen={setInviteOpen} />
        </>
    );
}
