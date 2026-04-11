import ShowSkippableModal from '@/components/ShowSkippableModal';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
    const { auth } = usePage<{ auth: { user: { role: string[] | string } } }>().props;

    // Always treat roles as an array
    const userRoles: string[] = Array.isArray(auth?.user?.role) ? auth.user.role : [auth?.user?.role];

    const isRecruiter = userRoles.includes('recruiter');
    const isStaff = userRoles.some((role) =>
        ['admin', 'moderateur', 'studio_responsable', 'coach', 'super_admin'].includes(role),
    );
    const useSidebarLayout = isRecruiter || isStaff;

    const Layout = useSidebarLayout ? AppSidebarLayout : AppHeaderLayout;

    const needsStudentHeaderOffset =
        !useSidebarLayout && userRoles.some((r) => ['student', 'coworker'].includes(r));

    return (
        <Layout breadcrumbs={breadcrumbs} {...props}>
            <div
                className={`bg-light dark:bg-dark ${needsStudentHeaderOffset ? 'pt-20' : ''} mx-auto my-6 h-full w-[96%] rounded-lg shadow-lg`}
            >
                <ShowSkippableModal />
                {children}
            </div>
        </Layout>
    );
}
