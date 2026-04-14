import { usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    Boxes,
    Briefcase,
    Building2,
    CalendarCheck2,
    CheckSquare,
    Cog,
    Computer,
    FolderKanban,
    GraduationCap,
    LayoutGrid,
    MapPin,
    Settings,
    Trophy,
    Users,
} from 'lucide-react';
import { useMemo } from 'react';

export function useSearchItems() {
    const { auth } = usePage().props; // Get auth from Inertia's page props

    // Search items based on the user profile (you can also filter based on the user's role/permissions)
    const searchItems = useMemo(
        () => [
            // Navigation
            {
                title: 'Dashboard',
                href: '/admin/dashboard',
                category: 'Navigation',
                icon: LayoutGrid,
                keywords: ['home', 'main', 'overview'],
            },
            {
                title: 'Leaderboard',
                href: '/students/leaderboard',
                category: 'Navigation',
                icon: Trophy,
                keywords: ['leader', 'ranking', 'score', 'winners'],
            },
            {
                title: 'Jobs',
                href: '/students/jobs',
                category: 'Navigation',
                icon: Briefcase,
                keywords: ['jobs', 'career', 'internship', 'full-time', 'hiring', 'employment'],
                description: 'Browse open job listings',
            },

            // User Management
            {
                title: 'Users',
                href: '/admin/users',
                category: 'Management',
                icon: Users,
                keywords: ['user', 'student', 'team', 'member', 'people', 'account'],
                description: 'Manage users and accounts',
            },
            {
                title: 'View User Profile',
                href: '/settings/profile',
                category: 'User',
                icon: Users,
                keywords: ['profile', 'account', 'my profile', 'me'],
                description: 'View your profile settings',
            },

            // Projects & Tasks
            {
                title: 'Projects',
                href: '/admin/projects',
                category: 'Projects',
                icon: FolderKanban,
                keywords: ['project', 'workspace', 'team project'],
                description: 'Manage projects and teams',
            },
            {
                title: 'Project Tasks',
                href: '/admin/projects',
                category: 'Projects',
                icon: CheckSquare,
                keywords: ['task', 'todo', 'assign', 'work item'],
                description: 'View and manage tasks',
            },

            // Equipment & Inventory
            {
                title: 'Equipment',
                href: '/admin/equipment',
                category: 'Inventory',
                icon: Boxes,
                keywords: ['equipment', 'gear', 'device', 'tool', 'inventory'],
                description: 'Manage equipment and inventory',
            },
            {
                title: 'Computers',
                href: '/admin/computers',
                category: 'Inventory',
                icon: Computer,
                keywords: ['computer', 'pc', 'machine', 'laptop', 'desktop'],
                description: 'Manage computer inventory',
            },

            // Reservations & Scheduling
            {
                title: 'Reservations',
                href: '/admin/reservations',
                category: 'Scheduling',
                icon: CalendarCheck2,
                keywords: ['reservation', 'booking', 'calendar', 'schedule', 'appointment'],
                description: 'View and manage reservations',
            },
            {
                title: 'Reservation Analytics',
                href: '/admin/reservations/analytics',
                category: 'Analytics',
                icon: BarChart3,
                keywords: ['analytics', 'stats', 'report', 'data', 'reservation analytics'],
                description: 'View reservation statistics',
            },
            {
                title: 'Places',
                href: '/admin/places',
                category: 'Management',
                icon: MapPin,
                keywords: ['place', 'location', 'studio', 'cowork', 'meeting room'],
                description: 'Manage spaces and places',
            },

            // Training & Education
            {
                title: 'Training',
                href: '/admin/training',
                category: 'Training',
                icon: GraduationCap,
                keywords: ['training', 'course', 'lesson', 'education', 'learn'],
                description: 'Manage training sessions',
            },
            {
                title: 'Geeko Sessions',
                href: '/admin/training/geeko',
                category: 'Training',
                icon: BookOpen,
                keywords: ['geeko', 'quiz', 'game', 'session', 'question'],
                description: 'Manage Geeko game sessions',
            },

            // Settings
            {
                title: 'Settings - Profile',
                href: '/settings/profile',
                category: 'Settings',
                icon: Settings,
                keywords: ['settings', 'profile', 'account', 'personal'],
                description: 'Update your profile information',
            },
            {
                title: 'Settings - Password',
                href: '/settings/password',
                category: 'Settings',
                icon: Cog,
                keywords: ['password', 'security', 'change password'],
                description: 'Change your password',
            },

            // Recruiter (if exists)
            {
                title: 'Recruiter',
                href: '/admin/Recruiter',
                category: 'Management',
                icon: Building2,
                keywords: ['recruiter', 'recruitment', 'hiring'],
                description: 'Recruitment management',
            },
        ],
        [auth],
    );

    // Search function to filter items based on query
    function search(query) {
        if (!query.trim()) return [];

        const lowerQuery = query.toLowerCase().trim();
        const queryWords = lowerQuery.split(/\s+/);

        const scoredItems = searchItems
            .map((item) => {
                let score = 0;

                // Exact title match
                if (item.title.toLowerCase() === lowerQuery) {
                    score += 100;
                } else if (item.title.toLowerCase().startsWith(lowerQuery)) {
                    score += 50;
                } else if (item.title.toLowerCase().includes(lowerQuery)) {
                    score += 30;
                }

                // Description match
                if (item.description?.toLowerCase().includes(lowerQuery)) {
                    score += 20;
                }

                // Category match
                if (item.category.toLowerCase().includes(lowerQuery)) {
                    score += 15;
                }

                // Keywords match
                if (item.keywords) {
                    const keywordMatches = item.keywords.filter((keyword) => keyword.toLowerCase().includes(lowerQuery)).length;
                    score += keywordMatches * 10;

                    // Multi-word matching
                    const allKeywords = item.keywords.join(' ').toLowerCase();
                    queryWords.forEach((word) => {
                        if (allKeywords.includes(word)) {
                            score += 5;
                        }
                    });
                }

                // URL/href matching
                if (item.href?.toLowerCase().includes(lowerQuery)) {
                    score += 10;
                }

                return { item, score };
            })
            .filter(({ score }) => score > 0)
            .sort((a, b) => b.score - a.score)
            .map(({ item }) => item);

        return scoredItems;
    }

    return { searchItems, search };
}
