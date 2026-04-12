import BookAppointment from '@/components/book-appointment';
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import { type User } from '@/types';
import { Link, router } from '@inertiajs/react';
import { Book, Dock, LayoutGrid, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { AddDocumentModal } from './add-document-modal';
import Rolegard from './rolegard';

interface UserMenuContentProps {
    user: User;
}

function userRoles(user: User): string[] {
    const r = user.role;
    if (Array.isArray(r)) {
        return r.filter(Boolean) as string[];
    }
    return r ? [r as string] : [];
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const isRecruiter = userRoles(user).includes('recruiter');
    const profileHref = isRecruiter ? edit() : `/students/${user.id}`;

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={false} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <Rolegard authorized={['admin', 'responsable_studio', 'coach']}>
                    <DropdownMenuItem asChild>
                        <Link className="block w-full" href="/admin/dashboard" prefetch onClick={cleanup}>
                            <LayoutGrid className="mr-2" />
                            Back to admin
                        </Link>
                    </DropdownMenuItem>
                </Rolegard>
                <DropdownMenuItem asChild>
                    <Link className="block w-full" href={profileHref} prefetch onClick={cleanup}>
                        <UserIcon className="mr-2" />
                        View Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault();
                        setTimeout(() => {
                            setIsDocModalOpen(true);
                        }, 150);
                    }}
                    className="flex cursor-pointer items-center"
                >
                    <Dock className="mr-2" />
                    Add document
                </DropdownMenuItem>

                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault();
                        setTimeout(() => {
                            setIsAppointmentModalOpen(true);
                        }, 150);
                    }}
                >
                    <Book className="mr-2" />
                    Book an appointment
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link className="block w-full" href={edit()} as="button" prefetch onClick={cleanup}>
                        <Settings className="mr-2" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link className="block w-full" href={logout()} as="button" onClick={handleLogout} data-test="logout-button">
                    <LogOut className="mr-2" />
                    Log out
                </Link>
            </DropdownMenuItem>

            {/* Add Document Modal */}
            <AddDocumentModal user={user} isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} />
            <BookAppointment
                isOpen={isAppointmentModalOpen}
                onClose={() => setIsAppointmentModalOpen(false)}
                onSuccess={(selectedPerson) => {
                    console.log('Appointment booked with:', selectedPerson);
                }}
            />
        </>
    );
}
