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

/** Student-style top nav routes (same links as `AppHeader`): hide admin sidebar for staff here. */
function isStudentPublicShellPath(pathname: string): boolean {
    if (pathname === '/students/feed') {
        return true;
    }
    const prefixes = [
        '/students/jobs',
        '/students/leaderboard',
        '/students/spaces',
        '/students/reservations',
        '/students/projects',
        '/students/project',
    ];

    if (prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
        return true;
    }

    // Student profile & posts: /students/123, /students/123/posts
    if (/^\/students\/\d+$/.test(pathname) || /^\/students\/\d+\/posts$/.test(pathname)) {
        return true;
    }

    return false;
}

export default function AppLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
    const page = usePage<{ auth: { user: { role: string[] | string } } }>();
    const { auth } = page.props;

    // Always treat roles as an array
    const userRoles: string[] = Array.isArray(auth?.user?.role) ? auth.user.role : [auth?.user?.role];

    const isRecruiter = userRoles.includes('recruiter');
    const isStaff = userRoles.some((role) =>
        ['admin', 'moderateur', 'studio_responsable', 'coach', 'super_admin'].includes(role),
    );

    // Student-area pages: top navbar only (no admin sidebar) so staff browse like students.
    const pathname = page.url.split('?')[0];
    const useStudentHeaderShell = isStaff && isStudentPublicShellPath(pathname);
    const useSidebarLayout = (isRecruiter || isStaff) && !useStudentHeaderShell;

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
