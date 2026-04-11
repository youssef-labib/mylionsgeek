import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import RoleBadge from '@/pages/admin/users/partials/RoleBadge';
import { router } from '@inertiajs/react';
import { ChevronsLeft, ChevronsRight, CircleCheckBig, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function RecruitersTable({ recruiters }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteUser, setDeleteUser] = useState(null);
    const [openDelete, setOpenDelete] = useState(false);
    const itemsPerPage = 10;
    const totalPages = Math.max(1, Math.ceil(recruiters.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = recruiters.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [recruiters]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const changeAccountStatus = (user) => {
        setDeleteUser(user);
        setOpenDelete(true);
    };

    const deleteConfirmedUser = () => {
        if (!deleteUser) return;
        const newState = deleteUser.account_state === 1 ? 0 : 1;
        router.post(
            `/admin/users/update/${deleteUser.id}/account-state`,
            {
                _method: 'put',
                account_state: newState,
            },
            {
                onSuccess: () => {
                    setOpenDelete(false);
                    setDeleteUser(null);
                },
                onError: () => {
                    setOpenDelete(false);
                    setDeleteUser(null);
                },
            },
        );
    };

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Members</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Menu</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {currentItems.map((user) => (
                        <TableRow key={user.id} className="cursor-pointer">
                            <TableCell className="flex items-center gap-4 font-medium">
                                <Avatar
                                    className="h-8 w-8 overflow-hidden rounded-full"
                                    image={user.image}
                                    name={user.name}
                                    lastActivity={user.last_online || null}
                                    onlineCircleClass="hidden"
                                />
                                <div className="flex flex-col">
                                    <span className="capitalize">{user.name}</span>
                                </div>
                            </TableCell>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell className="font-medium">{user.status ?? '—'}</TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-2">
                                    {user.role ? <RoleBadge role={user.role} email={user.email} /> : <span className="text-xs text-gray-400">No role</span>}
                                </div>
                            </TableCell>
                            <TableCell className="flex items-center gap-2 font-medium">
                                <Button
                                    type="button"
                                    className="cursor-pointer bg-transparent p-2 duration-200 hover:bg-transparent"
                                    title={user.account_state === 1 ? 'Suspend' : 'Activate'}
                                    onClick={() => changeAccountStatus(user)}
                                >
                                    {user.account_state === 1 ? (
                                        <CircleCheckBig size={25} className="text-green-600" />
                                    ) : (
                                        <Trash size={25} className="text-error" />
                                    )}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {openDelete && deleteUser && (
                <AlertDialog open={openDelete}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-dark dark:text-light">Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-dark dark:text-light">
                                {deleteUser.account_state === 1
                                    ? 'This will temporarily suspend this account and prevent access until reactivated.'
                                    : 'This will reactivate this account and restore access.'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer" onClick={() => setOpenDelete(false)}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                className={`cursor-pointer ${deleteUser.account_state === 1 ? 'bg-error text-light hover:bg-error/80' : 'bg-alpha text-dark hover:bg-alpha/80'}`}
                                onClick={deleteConfirmedUser}
                            >
                                Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            <div className="mt-10 flex w-full items-center justify-center gap-5">
                <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="cursor-pointer rounded-lg bg-beta p-2 text-light disabled:opacity-40 dark:bg-light dark:text-dark"
                >
                    <ChevronsLeft />
                </button>
                <span>
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="cursor-pointer rounded-lg bg-beta p-2 text-light disabled:opacity-40 dark:bg-light dark:text-dark"
                >
                    <ChevronsRight />
                </button>
            </div>
        </div>
    );
}
