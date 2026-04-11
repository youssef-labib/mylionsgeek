import { NavMain } from '@/components/nav-main';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import {
    AwardIcon,
    Briefcase,
    Building2,
    Calendar,
    ClipboardList,
    FolderOpen,
    GraduationCap,
    LayoutGrid,
    Monitor,
    Settings,
    Timer,
    UserPlus,
    Users,
    Wrench,
} from 'lucide-react';
import { useMemo } from 'react';
import AppLogo from './app-logo';

const getRecruiterNavItems = () => [
    {
        id: 'recruiter_jobs',
        title: 'Assigned jobs',
        href: '/recruiter/jobs',
        icon: Briefcase,
        authorizedRoles: ['recruiter'],
    },
    {
        id: 'recruiter_applications',
        title: 'Applications',
        href: '/recruiter/applications',
        icon: ClipboardList,
        authorizedRoles: ['recruiter'],
    },
    {
        id: 'recruiter_settings',
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        authorizedRoles: ['recruiter'],
    },
];

const getAllNavItems = () => [
    {
        id: 'dashboard',
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutGrid,
    },

    {
        id: 'members',
        title: 'Members',
        href: '/admin/users',
        icon: Users,
        excludedRoles: ['studio_responsable'],
    },

    {
        id: 'jobs',
        title: 'Jobs',
        href: '/admin/jobs',
        icon: Briefcase,
        authorizedRoles: ['admin', 'moderateur', 'super_admin'],
    },
    {
        id: 'recruiters',
        title: 'Recruiters',
        href: '/admin/recruiters',
        icon: UserPlus,
        authorizedRoles: ['admin', 'moderateur', 'super_admin'],
    },

    {
        id: 'projects',
        title: 'Projects',
        href: '/admin/projects',
        icon: FolderOpen,
        excludedRoles: ['studio_responsable'],
    },

    {
        id: 'leaderboard',
        title: 'LeaderBoard',
        href: '/students/leaderboard',
        icon: AwardIcon,
        excludedRoles: ['studio_responsable'],
    },

    {
        id: 'spaces',
        title: 'Spaces ',
        href: '/admin/places',
        icon: Building2,
        excludedRoles: ['coach'],
    },
    { id: 'reservations', title: 'Reservations', href: '/admin/reservations', icon: Timer, excludedRoles: ['coach'] },
    { id: 'appointments', title: 'Appointments', href: '/admin/appointments', icon: Calendar },

    { id: 'computers', title: 'Computers', href: '/admin/computers', icon: Monitor, excludedRoles: ['studio_responsable'] },
    { id: 'equipment', title: 'Equipment', href: '/admin/equipements', icon: Wrench, excludedRoles: ['coach'] },
    { id: 'training', title: 'Training', href: '/admin/training', icon: GraduationCap, excludedRoles: ['studio_responsable'] },
    // { id: 'games', title: 'Games', href: '/games', icon: Gamepad2 },
    { id: 'settings', title: 'Settings', href: '/settings', icon: Settings },
];

// Footer links removed per request

// Check if user is one of the appointment persons
const isAppointmentPerson = (user) => {
    if (!user) return false;

    const personNames = ['Mahdi Bouziane', 'Hamid Boumehraz', 'Amina Khabab', 'Ayman Boujjar'];
    const emailMapping = {
        'mahdi.bouziane@lionsgeek.com': true,
        'hamid.boumehraz@lionsgeek.com': true,
        'amina.khabab@lionsgeek.com': true,
        'aymenboujjar12@gmail.com': true,
    };

    // Check by name
    if (personNames.includes(user.name)) {
        return true;
    }

    // Check by email
    if (user.email && emailMapping[user.email.toLowerCase()]) {
        return true;
    }

    return false;
};

export function AppSidebar() {
    const { auth } = usePage().props;
    const user = auth?.user;

    const userRoles = Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [];
    const isStaff = userRoles.some((r) => ['admin', 'moderateur', 'studio_responsable', 'coach', 'super_admin'].includes(r));
    const isRecruiterOnlySidebar = userRoles.includes('recruiter') && !isStaff;

    const logoHref = isRecruiterOnlySidebar ? '/recruiter/jobs' : '/admin/dashboard';

    // Filter nav items based on user permissions
    const mainNavItems = useMemo(() => {
        if (isRecruiterOnlySidebar) {
            return getRecruiterNavItems();
        }

        const allItems = getAllNavItems();

        return allItems.filter((item) => {
            // Filter out appointments if user is not an appointment person
            if (item.id === 'appointments') {
                return isAppointmentPerson(user);
            }
            return true;
        });
    }, [user, isRecruiterOnlySidebar]);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={logoHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>{/* <NavUser /> */}</SidebarFooter>
        </Sidebar>
    );
}
