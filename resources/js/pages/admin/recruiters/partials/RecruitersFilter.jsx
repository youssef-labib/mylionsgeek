import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function RecruitersFilter({ search, setSearch }) {
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <div className="relative lg:col-span-2">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                    type="text"
                    placeholder="Search by name or email"
                    className="bg-[#e5e5e5] pl-10 text-[#0a0a0a] placeholder-[#0a0a0a]/50 dark:bg-[#262626] dark:text-white dark:placeholder-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>
    );
}
