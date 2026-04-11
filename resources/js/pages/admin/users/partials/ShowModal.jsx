import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';
import { router, usePage } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';
import DeleteModal from '../../../../components/DeleteModal';
import { timeAgo } from '../../../../lib/utils';
import LineStatistic from './components/LineChart';
const User = ({ user, trainings, close, open }) => {
    const { auth } = usePage().props;

    const [projects, setProjects] = useState([]);
    const [rejectingId, setRejectingId] = useState(null);
    const [approvingId, setApprovingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [reviewRatings, setReviewRatings] = useState({
        good_structure: false,
        clean_code: false,
        pure_code: false,
        pure_ai: false,
        mix_vibe: false,
        responsive_design: false,
        good_performance: false,
    });
    const [reviewNotes, setReviewNotes] = useState('');
    const [processingId, setProcessingId] = useState(null);

    const getInitials = useInitials();
    const [activeTab, setActiveTab] = useState('overview');
    const [summary, setSummary] = useState({ discipline: null, recentAbsences: [] });
    const [notes, setNotes] = useState([]);
    const [docs, setDocs] = useState({ contracts: [], medicals: [] });
    const [chartData, setChartData] = useState();
    const [selectedFileName, setSelectedFileName] = useState('');
    const [SusupendAccount, setSusupendAccount] = useState(false);

    const fetchChart = async () => {
        const res = await fetch(`/admin/users/${user?.id}/attendance-chart`);
        const data = await res.json();
        setChartData(data);
    };
    useEffect(() => {
        fetchChart();
    }, [user?.id]);

    React.useEffect(() => {
        if (!open) return;
        fetch(`/admin/users/${user.id}/attendance-summary`)
            .then((r) => r.json())
            .then((data) =>
                setSummary({
                    discipline: data?.discipline ?? null,
                    recentAbsences: Array.isArray(data?.recentAbsences) ? data.recentAbsences : [],
                    monthlyFullDayAbsences: Array.isArray(data?.monthlyFullDayAbsences) ? data.monthlyFullDayAbsences : [],
                }),
            )
            .catch(() => setSummary({ discipline: null, recentAbsences: [] }));
        fetch(`/admin/users/${user.id}/notes`)
            .then((r) => r.json())
            .then((data) => setNotes(Array.isArray(data?.notes) ? data.notes : []))
            .catch(() => setNotes([]));
        fetch(`/admin/users/${user.id}/documents`)
            .then((r) => r.json())
            .then((data) =>
                setDocs({
                    contracts: Array.isArray(data?.contracts) ? data.contracts : [],
                    medicals: Array.isArray(data?.medicals) ? data.medicals : [],
                }),
            )
            .catch(() => setDocs({ contracts: [], medicals: [] }));
        // Fetch projects
        fetch(`/admin/users/${user.id}/projects`)
            .then((r) => r.json())
            .then((data) => setProjects(Array.isArray(data?.projects) ? data.projects : []))
            .catch(() => setProjects([]));
    }, [open, user.id]);
    const [processing, setProcessing] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadKind, setUploadKind] = useState('contract');
    const trainingName = useMemo(() => trainings.find((t) => t.id === user.formation_id)?.name || '-', [trainings, user]);

    const handleSsuspned = () => {
        if (SusupendAccount) {
            // Assuming the delete endpoint is something like this
            const newState = user.account_state === 1 ? 0 : 1;
            router.post(
                `/admin/users/update/${user.id}/account-state`,
                {
                    _method: 'put',
                    account_state: newState,
                },
                {
                    onSuccess: () => {
                        // Handle success
                        setSusupendAccount(false);
                    },
                    onError: () => {
                        // Handle error
                        setSusupendAccount(false);
                    },
                },
            );
        }
    };

    React.useEffect(() => {
        if (!open) return;

        // Fetch attendance summary
        fetch(`/admin/users/${user.id}/attendance-summary`)
            .then((r) => r.json())
            .then(async (data) => {
                const newDiscipline = data?.discipline ?? null;
                //console.log(' NEW DISCIPLINE:', newDiscipline);
                // Set summary state
                setSummary({
                    discipline: newDiscipline,
                    recentAbsences: Array.isArray(data?.recentAbsences) ? data.recentAbsences : [],
                    monthlyFullDayAbsences: Array.isArray(data?.monthlyFullDayAbsences) ? data.monthlyFullDayAbsences : [],
                });

                if (newDiscipline !== null) {
                    // Get old discipline from localStorage
                    const storageKey = `discipline_${user.id}`;
                    const oldDiscipline = localStorage.getItem(storageKey);

                    if (oldDiscipline !== null) {
                        const oldValue = parseInt(oldDiscipline);
                        const change = newDiscipline - oldValue;

                        // If change >= 5% or <= -5%, send notification
                        if (Math.abs(change) >= 5) {
                            try {
                                const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

                                await fetch('/api/discipline-change-notification', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRF-TOKEN': csrf,
                                        Accept: 'application/json',
                                    },
                                    credentials: 'same-origin',
                                    body: JSON.stringify({
                                        user_id: user.id,
                                        user_name: user.name,
                                        old_discipline: oldValue,
                                        new_discipline: newDiscipline,
                                        change: change,
                                        promo: user.promo || 'N/A',
                                    }),
                                });

                                const result = await response.json();
                            } catch (error) {
                                console.error('Failed to send discipline notification:', error);
                            }
                        } else {
                            //console.log(' Change too small:', change);
                        }
                    } else {
                        //console.log(' No old discipline in localStorage (first time)');
                    }

                    // Update localStorage with new discipline
                    localStorage.setItem(storageKey, newDiscipline.toString());
                }
            })
            .catch(() => setSummary({ discipline: null, recentAbsences: [] }));

        // ... rest of fetches (notes, docs, projects)
        fetch(`/admin/users/${user.id}/notes`)
            .then((r) => r.json())
            .then((data) => setNotes(Array.isArray(data?.notes) ? data.notes : []))
            .catch(() => setNotes([]));

        fetch(`/admin/users/${user.id}/documents`)
            .then((r) => r.json())
            .then((data) =>
                setDocs({
                    contracts: Array.isArray(data?.contracts) ? data.contracts : [],
                    medicals: Array.isArray(data?.medicals) ? data.medicals : [],
                }),
            )
            .catch(() => setDocs({ contracts: [], medicals: [] }));

        fetch(`/admin/users/${user.id}/projects`)
            .then((r) => r.json())
            .then((data) => setProjects(Array.isArray(data?.projects) ? data.projects : []))
            .catch(() => setProjects([]));
    }, [open, user.id]);

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="max-h-[90vh] overflow-x-visible overflow-y-auto border border-alpha/20 bg-light text-dark sm:max-w-[900px] dark:bg-dark dark:text-light">
                {/* <DialogHeader className="border-b border-alpha/10">
                    <DialogTitle className="text-dark dark:text-light text-xl pb-2 font-bold">{user?.name}</DialogTitle>
                </DialogHeader> */}

                {/* Tabs Navigation */}
                <div className="mt-2 px-1">
                    <div className="flex gap-1 border-b border-alpha/10">
                        {['overview', 'attendance', 'projects', 'documents', 'notes'].map((tab) => (
                            <button
                                key={tab}
                                className={`rounded-t-lg px-4 py-3 text-sm font-medium capitalize transition-all ${
                                    activeTab === tab
                                        ? 'border-b-2 border-alpha bg-alpha/5 text-alpha'
                                        : 'text-neutral-600 hover:bg-alpha/5 hover:text-alpha dark:text-neutral-400'
                                }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'overview' && (
                    <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Left Column - Profile Card */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-6 rounded-2xl border border-alpha/20 bg-gradient-to-br from-alpha/10 to-beta/10 px-6 py-10 shadow-lg">
                                <div className="flex flex-col items-center">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <Avatar
                                            className="h-28 w-28 overflow-hidden rounded-full ring-4 ring-alpha/20"
                                            image={user.image}
                                            name={user.name}
                                            lastActivity={user.last_online || null}
                                            onlineCircleClass="w-7 h-7"
                                        />
                                        <div
                                            className={`absolute -right-1 -bottom-1 h-7 w-7 rounded-full border-4 border-light dark:border-dark ${
                                                timeAgo(user.last_online) === 'Online now' ? 'bg-green-500' : 'bg-neutral-500'
                                            }`}
                                        ></div>
                                    </div>

                                    {/* Name & Email */}
                                    <h3 className="mt-4 text-center text-xl font-bold text-dark dark:text-light">{user.name || '-'}</h3>
                                    <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">{user.email || '-'}</p>

                                    {/* Status Indicator */}
                                    <div className="mt-3 flex items-center gap-2 rounded-full border border-alpha/10 bg-white/60 px-3 py-1.5 backdrop-blur dark:bg-neutral-900/60">
                                        <span
                                            className={`h-2 w-2 rounded-full ${
                                                timeAgo(user.last_online) === 'Online now' ? 'animate-pulse bg-green-500' : 'bg-neutral-400'
                                            }`}
                                        ></span>
                                        <span
                                            className={`text-xs font-medium ${
                                                timeAgo(user.last_online) === 'Online now'
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-neutral-500 dark:text-neutral-400'
                                            }`}
                                        >
                                            {timeAgo(user.last_online)}
                                        </span>
                                    </div>

                                    {/* Role & Status Grid */}
                                    <div className="mt-6 grid w-full grid-cols-2 gap-3">
                                        {/* Role Section */}
                                        <div className="rounded-xl border border-alpha/10 bg-white/60 p-3 text-center backdrop-blur dark:bg-neutral-900/60">
                                            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Role</div>
                                            <div className="mt-1 flex flex-col space-y-1 text-sm font-bold text-dark dark:text-light">
                                                {user.role?.length > 0 ? (
                                                    user.role.map((r, index) => <span key={index}>{r}</span>)
                                                ) : (
                                                    <span className="text-neutral-500 dark:text-neutral-400">-</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status Section */}
                                        <div className="rounded-xl border border-alpha/10 bg-white/60 p-3 text-center backdrop-blur dark:bg-neutral-900/60">
                                            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Status</div>
                                            <div className="mt-1 text-sm font-bold text-green-600 dark:text-green-400">{user.status || '-'}</div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="mt-6 flex w-full flex-col gap-2 space-y-2">
                                        {/* <Button
                                            disabled={processing}
                                            onClick={() => router.visit(`/admin/users/${user.id}`)}
                                            className="w-full"
                                            size="sm"
                                        >
                                            Open Full Profile
                                        </Button> */}
                                        <Button
                                            disabled={processing}
                                            onClick={() => setSusupendAccount(true)}
                                            variant={user.account_state ? 'default' : 'danger'}
                                            className="w-full hover:text-black"
                                            size="sm"
                                        >
                                            {user.account_state ? 'Activate Account' : 'Suspend Account'}
                                        </Button>
                                        <Button
                                            className="cursor-pointer border border-[var(--color-alpha)] bg-[var(--color-alpha)] text-black hover:bg-transparent hover:text-[var(--color-alpha)]"
                                            onClick={() => router.get(`/admin/users/${user.id}`)}
                                        >
                                            View Full Profile
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {SusupendAccount && (
                            <DeleteModal
                                open={SusupendAccount}
                                color={user.account_state === 1 ? 'alpha' : 'error'}
                                onOpenChange={setSusupendAccount}
                                title={user.account_state === 1 ? `Activate ${user.name}` : `Suspend ${user.name}`}
                                description={`This action cannot be undone. This will permanently ${user.account_state === 1 ? 'Activate' : 'Suspend'} ${user.name} .`}
                                confirmLabel={user.account_state === 1 ? 'Activate' : 'Suspend'}
                                cancelLabel="Cancel"
                                onConfirm={handleSsuspned}
                                loading={false}
                            />
                        )}

                        {/* Right Column - Details */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Personal Information Section */}
                            <div className="overflow-hidden rounded-2xl border border-alpha/20 bg-light shadow-sm dark:bg-dark">
                                <div className="border-b border-alpha/20 bg-gradient-to-r from-alpha/10 to-beta/10 px-5 py-3">
                                    <h4 className="font-bold text-dark dark:text-light">Personal Information</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-alpha">Promo</Label>
                                        <p className="text-dark dark:text-light">{user.promo || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-alpha">Training</Label>
                                        <p className="text-dark dark:text-light">{trainingName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-alpha">Phone</Label>
                                        <p className="text-dark dark:text-light">{user.phone || '-'}</p>
                                    </div>
                                    {(auth.user?.role?.includes('admin') || auth.user?.role?.includes('moderateur')) && (
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-alpha">CIN</Label>
                                            <p className="text-dark dark:text-light">{user.cin || '-'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Access Rights & Discipline Section */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Access Rights */}
                                <div className="overflow-hidden rounded-2xl border border-alpha/20 bg-light shadow-sm dark:bg-dark">
                                    <div className="border-b border-alpha/20 bg-gradient-to-r from-alpha/10 to-beta/10 px-5 py-3">
                                        <h4 className="font-bold text-dark dark:text-light">Access Rights</h4>
                                    </div>
                                    <div className="space-y-3 p-5">
                                        <div className="flex items-center justify-between rounded-lg border border-alpha/10 bg-white/60 p-3 backdrop-blur dark:bg-neutral-900/60">
                                            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Studio</span>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    (user?.access?.access_studio ?? user?.access_studio)
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
                                                }`}
                                            >
                                                {(user?.access?.access_studio ?? user?.access_studio) ? 'Granted' : 'No Access'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg border border-alpha/10 bg-white/60 p-3 backdrop-blur dark:bg-neutral-900/60">
                                            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Cowork</span>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    (user?.access?.access_cowork ?? user?.access_cowork)
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
                                                }`}
                                            >
                                                {(user?.access?.access_cowork ?? user?.access_cowork) ? 'Granted' : 'No Access'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Discipline Score */}
                                <div className="overflow-hidden rounded-2xl border border-alpha/20 bg-gradient-to-br from-alpha/5 to-beta/5 shadow-sm">
                                    <div className="border-b border-alpha/20 bg-gradient-to-r from-alpha/10 to-beta/10 px-5 py-3">
                                        <h4 className="font-bold text-dark dark:text-light">Discipline Score</h4>
                                    </div>
                                    <div className="p-5">
                                        {summary.discipline == null ? (
                                            <p className="py-8 text-center text-sm text-neutral-500">No data available</p>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-4">
                                                <div className="text-5xl font-extrabold text-alpha">{summary.discipline}%</div>
                                                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-alpha to-beta transition-all duration-500"
                                                        style={{ width: `${Math.max(0, Math.min(100, summary.discipline))}%` }}
                                                    />
                                                </div>
                                                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Overall Performance</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div style={{ overflowX: 'auto' }} className="mt-4 rounded-xl border border-alpha/20 bg-light p-4 dark:bg-dark">
                        <LineStatistic chartData={chartData} />
                    </div>
                )}

                {activeTab === 'projects' && (
                    <div className="space-y-4 p-6">
                        <h3 className="text-lg font-semibold">Projects</h3>

                        {projects && projects.length > 0 ? (
                            <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                                {projects.map((project) => (
                                    <div
                                        key={project.id}
                                        className="relative flex flex-col gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700"
                                    >
                                        <div className="absolute right-4">
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${
                                                    project.status === 'approved'
                                                        ? 'bg-green-600 text-green-50 dark:text-white'
                                                        : project.status === 'rejected'
                                                          ? 'bg-red-600 text-red-50 dark:text-white'
                                                          : 'bg-yellow-600 text-yellow-50 dark:text-white'
                                                }`}
                                            >
                                                {project.status === 'pending' ? 'Pending' : project.status}
                                            </span>
                                        </div>
                                        {/* Image */}
                                        {project.image && (
                                            <div className="h-35 w-full flex-shrink-0 overflow-hidden rounded-lg">
                                                <img src={`/storage/${project.image}`} alt={project.title} className="h-full w-full object-cover" />
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="flex w-full flex-col justify-between">
                                            <div className="mb-2 flex items-start justify-between">
                                                <div>
                                                    <h4 className="mb-1 font-semibold">{project.title}</h4>

                                                    <p className="text-xs text-neutral-500">
                                                        {new Date(project.created_at).toLocaleString('en-US', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: false,
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mb-1 flex flex-wrap gap-2">
                                                {project.project && (
                                                    <a
                                                        href={`/students/project/${project.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-medium text-[var(--color-alpha)] hover:underline"
                                                    >
                                                        View →
                                                    </a>
                                                )}

                                                {project.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setApprovingId(project.id);
                                                                setReviewRatings({
                                                                    good_structure: false,
                                                                    clean_code: false,
                                                                    pure_code: false,
                                                                    pure_ai: false,
                                                                    mix_vibe: false,
                                                                    responsive_design: false,
                                                                    good_performance: false,
                                                                });
                                                                setReviewNotes('');
                                                            }}
                                                            disabled={processingId === project.id}
                                                            className="cursor-pointer rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setRejectingId(project.id);
                                                                setRejectionReason('');
                                                            }}
                                                            className="cursor-pointer rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Approve Modal with Ratings */}
                                        {approvingId === project.id && (
                                            <Dialog
                                                open={approvingId === project.id}
                                                onOpenChange={() => {
                                                    setApprovingId(null);
                                                    setReviewRatings({
                                                        good_structure: false,
                                                        clean_code: false,
                                                        pure_code: false,
                                                        pure_ai: false,
                                                        mix_vibe: false,
                                                        responsive_design: false,
                                                        good_performance: false,
                                                    });
                                                    setReviewNotes('');
                                                }}
                                            >
                                                <DialogContent className="max-h-[90vh] overflow-y-auto bg-light sm:max-w-[600px] dark:bg-dark">
                                                    <DialogHeader>
                                                        <DialogTitle>Review & Approve Project</DialogTitle>
                                                        <DialogDescription>
                                                            Please rate the project and add any notes before approving.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-6 py-4">
                                                        {/* Rating Checkboxes */}
                                                        <div className="space-y-4">
                                                            <Label className="text-base font-semibold">Project Ratings</Label>
                                                            <div className="grid grid-cols-1 gap-3">
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`approve-good_structure-${project.id}`}
                                                                        checked={reviewRatings.good_structure}
                                                                        onCheckedChange={(checked) =>
                                                                            setReviewRatings((prev) => ({ ...prev, good_structure: checked }))
                                                                        }
                                                                    />
                                                                    <Label
                                                                        htmlFor={`approve-good_structure-${project.id}`}
                                                                        className="cursor-pointer font-normal"
                                                                    >
                                                                        Good Structure
                                                                    </Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`approve-clean_code-${project.id}`}
                                                                        checked={reviewRatings.clean_code}
                                                                        onCheckedChange={(checked) =>
                                                                            setReviewRatings((prev) => ({ ...prev, clean_code: checked }))
                                                                        }
                                                                    />
                                                                    <Label
                                                                        htmlFor={`approve-clean_code-${project.id}`}
                                                                        className="cursor-pointer font-normal"
                                                                    >
                                                                        Clean Code
                                                                    </Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`approve-pure_code-${project.id}`}
                                                                        checked={reviewRatings.pure_code}
                                                                        onCheckedChange={(checked) =>
                                                                            setReviewRatings((prev) => ({ ...prev, pure_code: checked }))
                                                                        }
                                                                    />
                                                                    <Label
                                                                        htmlFor={`approve-pure_code-${project.id}`}
                                                                        className="cursor-pointer font-normal"
                                                                    >
                                                                        Pure Code
                                                                    </Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`approve-pure_ai-${project.id}`}
                                                                        checked={reviewRatings.pure_ai}
                                                                        onCheckedChange={(checked) =>
                                                                            setReviewRatings((prev) => ({ ...prev, pure_ai: checked }))
                                                                        }
                                                                    />
                                                                    <Label
                                                                        htmlFor={`approve-pure_ai-${project.id}`}
                                                                        className="cursor-pointer font-normal"
                                                                    >
                                                                        Pure AI
                                                                    </Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`approve-mix_vibe-${project.id}`}
                                                                        checked={reviewRatings.mix_vibe}
                                                                        onCheckedChange={(checked) =>
                                                                            setReviewRatings((prev) => ({ ...prev, mix_vibe: checked }))
                                                                        }
                                                                    />
                                                                    <Label
                                                                        htmlFor={`approve-mix_vibe-${project.id}`}
                                                                        className="cursor-pointer font-normal"
                                                                    >
                                                                        Mix Vibe One
                                                                    </Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`approve-responsive_design-${project.id}`}
                                                                        checked={reviewRatings.responsive_design}
                                                                        onCheckedChange={(checked) =>
                                                                            setReviewRatings((prev) => ({ ...prev, responsive_design: checked }))
                                                                        }
                                                                    />
                                                                    <Label
                                                                        htmlFor={`approve-responsive_design-${project.id}`}
                                                                        className="cursor-pointer font-normal"
                                                                    >
                                                                        Responsive Design
                                                                    </Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`approve-good_performance-${project.id}`}
                                                                        checked={reviewRatings.good_performance}
                                                                        onCheckedChange={(checked) =>
                                                                            setReviewRatings((prev) => ({ ...prev, good_performance: checked }))
                                                                        }
                                                                    />
                                                                    <Label
                                                                        htmlFor={`approve-good_performance-${project.id}`}
                                                                        className="cursor-pointer font-normal"
                                                                    >
                                                                        Good Performance
                                                                    </Label>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Notes */}
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`approve-review-notes-${project.id}`}>Review Notes</Label>
                                                            <Textarea
                                                                id={`approve-review-notes-${project.id}`}
                                                                value={reviewNotes}
                                                                onChange={(e) => setReviewNotes(e.target.value)}
                                                                placeholder="Add any additional notes about the project..."
                                                                rows={4}
                                                                className="resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                setApprovingId(null);
                                                                setReviewRatings({
                                                                    good_structure: false,
                                                                    clean_code: false,
                                                                    pure_code: false,
                                                                    pure_ai: false,
                                                                    mix_vibe: false,
                                                                    responsive_design: false,
                                                                    good_performance: false,
                                                                });
                                                                setReviewNotes('');
                                                            }}
                                                            disabled={processingId === project.id}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                setProcessingId(project.id);
                                                                router.post(
                                                                    `/admin/projects/${project.id}/approve`,
                                                                    {
                                                                        review_ratings: reviewRatings,
                                                                        review_notes: reviewNotes.trim(),
                                                                    },
                                                                    {
                                                                        onSuccess: () => {
                                                                            setProjects((prev) =>
                                                                                prev.map((p) =>
                                                                                    p.id === project.id ? { ...p, status: 'approved' } : p,
                                                                                ),
                                                                            );
                                                                            setApprovingId(null);
                                                                            setReviewRatings({
                                                                                good_structure: false,
                                                                                clean_code: false,
                                                                                pure_code: false,
                                                                                pure_ai: false,
                                                                                mix_vibe: false,
                                                                                responsive_design: false,
                                                                                good_performance: false,
                                                                            });
                                                                            setReviewNotes('');
                                                                        },
                                                                        onFinish: () => setProcessingId(null),
                                                                    },
                                                                );
                                                            }}
                                                            disabled={processingId === project.id}
                                                            className="bg-green-600 text-white hover:bg-green-700"
                                                        >
                                                            {processingId === project.id ? 'Approving...' : 'Approve Project'}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )}

                                        {/* Reject Modal */}
                                        {rejectingId === project.id && (
                                            <Dialog
                                                open={rejectingId === project.id}
                                                onOpenChange={() => {
                                                    setRejectingId(null);
                                                    setRejectionReason('');
                                                }}
                                            >
                                                <DialogContent className="bg-light sm:max-w-[500px] dark:bg-dark">
                                                    <DialogHeader>
                                                        <DialogTitle>Reject Project</DialogTitle>
                                                        <DialogDescription>
                                                            Please provide a reason for rejecting this project. This will be visible to the student.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`reject-reason-${project.id}`}>Rejection Reason *</Label>
                                                            <Textarea
                                                                id={`reject-reason-${project.id}`}
                                                                value={rejectionReason}
                                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                                placeholder="Enter the reason for rejection..."
                                                                rows={4}
                                                                className="resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                setRejectingId(null);
                                                                setRejectionReason('');
                                                            }}
                                                            disabled={processingId === project.id}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                if (!rejectionReason.trim()) {
                                                                    alert('Please provide a rejection reason minimum 1 characters');
                                                                    return;
                                                                }
                                                                setProcessingId(project.id);
                                                                router.post(
                                                                    `/admin/projects/${project.id}/reject`,
                                                                    {
                                                                        rejection_reason: rejectionReason.trim(),
                                                                    },
                                                                    {
                                                                        onSuccess: () => {
                                                                            setProjects((prev) =>
                                                                                prev.map((p) =>
                                                                                    p.id === project.id ? { ...p, status: 'rejected' } : p,
                                                                                ),
                                                                            );
                                                                            setRejectingId(null);
                                                                            setRejectionReason('');
                                                                        },
                                                                        onFinish: () => setProcessingId(null),
                                                                    },
                                                                );
                                                            }}
                                                            disabled={!rejectionReason.trim() || processingId === project.id}
                                                            className="bg-red-600 text-white hover:bg-red-700"
                                                        >
                                                            {processingId === project.id ? 'Rejecting...' : 'Reject Project'}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-neutral-500">No projects</p>
                        )}
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="mt-4 rounded-xl border border-alpha/20 bg-light p-5 dark:bg-dark">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <Label className="text-lg font-bold text-alpha">Documents</Label>
                                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Upload and manage user documents</p>
                            </div>
                        </div>

                        <form
                            className="rounded-xl border border-alpha/20 bg-gradient-to-br from-alpha/5 to-beta/5 p-4"
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                setUploadError('');
                                const kind = form.querySelector('select[name="docKind"]').value;
                                const name = form.querySelector('input[name="docName"]').value.trim();
                                const type = form.querySelector('input[name="docType"]').value.trim();
                                const fileInput = form.querySelector('input[name="docFile"]');
                                const file = fileInput && fileInput.files && fileInput.files[0];
                                if (!file) return;
                                const body = new FormData();
                                body.append('kind', kind);
                                body.append('file', file);
                                if (name) body.append('name', name);
                                if (kind === 'contract' && type) body.append('type', type);
                                const csrf = document.querySelector('meta[name="csrf-token"]').getAttribute('content') || '';
                                body.append('_token', csrf);
                                const res = await fetch(`/admin/users/${user.id}/documents`, {
                                    method: 'POST',
                                    headers: {
                                        'X-CSRF-TOKEN': csrf,
                                        'X-Requested-With': 'XMLHttpRequest',
                                        Accept: 'application/json',
                                    },
                                    credentials: 'same-origin',
                                    body,
                                });
                                if (!res.ok) {
                                    try {
                                        const data = await res.json();
                                        if (res.status === 419) {
                                            setUploadError('Your session expired. Please reload the page and try again.');
                                        } else {
                                            setUploadError(data?.message || 'Upload failed');
                                        }
                                    } catch (_) {
                                        const text = await res.text();
                                        setUploadError(
                                            res.status === 419
                                                ? 'Your session expired. Please reload the page and try again.'
                                                : text || 'Upload failed',
                                        );
                                    }
                                    return;
                                }
                                const r = await fetch(`/admin/users/${user.id}/documents`, {
                                    credentials: 'same-origin',
                                    headers: { Accept: 'application/json' },
                                });
                                const d = await r.json();
                                setDocs({
                                    contracts: Array.isArray(d?.contracts) ? d.contracts : [],
                                    medicals: Array.isArray(d?.medicals) ? d.medicals : [],
                                });
                                form.reset();
                                setUploadKind('contract');
                                setSelectedFileName('');
                            }}
                        >
                            <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-5">
                                {/* Document Type Select */}
                                <div>
                                    <Label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Document Type</Label>
                                    <select
                                        name="docKind"
                                        value={uploadKind}
                                        onChange={(e) => setUploadKind(e.target.value)}
                                        className="w-full rounded-lg border border-alpha/30 bg-white px-3 py-2.5 text-sm transition-all focus:ring-2 focus:ring-alpha/50 focus:outline-none dark:bg-neutral-800"
                                    >
                                        <option value="contract">Contract</option>
                                        <option value="medical">Medical</option>
                                    </select>
                                </div>

                                {/* Name/Description */}
                                <div>
                                    <Label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                        {uploadKind === 'contract' ? 'Document Name' : 'Description'}
                                    </Label>
                                    <input
                                        name="docName"
                                        type="text"
                                        placeholder={uploadKind === 'contract' ? 'Enter name' : 'Enter description'}
                                        className="w-full rounded-lg border border-alpha/30 bg-white px-3 py-2.5 text-sm transition-all focus:ring-2 focus:ring-alpha/50 focus:outline-none dark:bg-neutral-800"
                                    />
                                </div>

                                {/* Contract Type (conditional) */}
                                {uploadKind === 'contract' ? (
                                    <div>
                                        <Label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                            Contract Type
                                        </Label>
                                        <input
                                            name="docType"
                                            type="text"
                                            placeholder="e.g., Full-time"
                                            className="w-full rounded-lg border border-alpha/30 bg-white px-3 py-2.5 text-sm transition-all focus:ring-2 focus:ring-alpha/50 focus:outline-none dark:bg-neutral-800"
                                        />
                                    </div>
                                ) : (
                                    <input name="docType" type="hidden" value="" />
                                )}

                                {/* File Upload */}
                                <div>
                                    <Label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Select File</Label>
                                    <label
                                        htmlFor="docFile"
                                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-alpha/40 bg-white px-3 py-2.5 text-sm text-neutral-600 transition-all hover:border-alpha hover:bg-alpha/5 dark:bg-neutral-800 dark:text-neutral-300"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                            />
                                        </svg>
                                        <span className="truncate">{selectedFileName || 'Choose file'}</span>
                                    </label>
                                    <input
                                        id="docFile"
                                        name="docFile"
                                        type="file"
                                        accept="application/pdf,image/*"
                                        required
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            setSelectedFileName(file ? file.name : '');
                                        }}
                                    />
                                </div>

                                {/* Upload Button */}
                                <div>
                                    <Button
                                        type="submit"
                                        className="w-full cursor-pointer border border-[var(--color-alpha)] bg-[var(--color-alpha)] text-black hover:bg-transparent hover:text-[var(--color-alpha)]"
                                    >
                                        Upload
                                    </Button>
                                </div>
                            </div>
                        </form>

                        {uploadError && (
                            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                                {uploadError}
                            </div>
                        )}

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-alpha/20 bg-gradient-to-br from-alpha/5 to-alpha/10 p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <svg className="h-5 w-5 text-alpha" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <div className="text-sm font-bold text-alpha">Contracts</div>
                                    </div>
                                    <div className="rounded-full bg-alpha px-2.5 py-1 text-xs font-semibold text-black">
                                        {docs.contracts?.length || 0}
                                    </div>
                                </div>
                                {Array.isArray(docs.contracts) && docs.contracts.length > 0 ? (
                                    <ul className="space-y-2">
                                        {docs.contracts.map((d, i) => (
                                            <li
                                                key={i}
                                                className="group flex items-center justify-between rounded-lg border border-alpha/20 bg-white px-3 py-2.5 transition-all hover:bg-alpha/5 dark:bg-neutral-800 dark:hover:bg-alpha/10"
                                            >
                                                <span className="max-w-[70%] truncate text-sm text-neutral-700 dark:text-neutral-200">{d.name}</span>
                                                {d.id ? (
                                                    <a
                                                        className="flex items-center gap-1 text-xs font-semibold text-alpha hover:underline"
                                                        href={`/admin/users/${user.id}/documents/contract/${d.id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        View
                                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                            />
                                                        </svg>
                                                    </a>
                                                ) : d.url ? (
                                                    <a
                                                        className="flex items-center gap-1 text-xs font-semibold text-alpha hover:underline"
                                                        href={d.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        View
                                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                            />
                                                        </svg>
                                                    </a>
                                                ) : null}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="py-8 text-center text-neutral-500">
                                        <svg className="mx-auto mb-2 h-12 w-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <p className="text-xs">No contracts uploaded</p>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-xl border border-alpha/20 bg-gradient-to-br from-alpha/5 to-alpha/10 p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <svg className="h-5 w-5 text-alpha" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <div className="text-sm font-bold text-alpha">Medical Certificates</div>
                                    </div>
                                    <div className="rounded-full bg-alpha px-2.5 py-1 text-xs font-semibold text-black">
                                        {docs.medicals?.length || 0}
                                    </div>
                                </div>
                                {Array.isArray(docs.medicals) && docs.medicals.length > 0 ? (
                                    <ul className="space-y-2">
                                        {docs.medicals.map((d, i) => (
                                            <li
                                                key={i}
                                                className="group flex items-center justify-between rounded-lg border border-alpha/20 bg-white px-3 py-2.5 transition-all hover:bg-alpha/5 dark:bg-neutral-800 dark:hover:bg-alpha/10"
                                            >
                                                <span className="max-w-[70%] truncate text-sm text-neutral-700 dark:text-neutral-200">{d.name}</span>
                                                {d.id ? (
                                                    <a
                                                        className="flex items-center gap-1 text-xs font-semibold text-alpha hover:underline"
                                                        href={`/admin/users/${user.id}/documents/medical/${d.id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        View
                                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                            />
                                                        </svg>
                                                    </a>
                                                ) : d.url ? (
                                                    <a
                                                        className="flex items-center gap-1 text-xs font-semibold text-alpha hover:underline"
                                                        href={d.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        View
                                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                            />
                                                        </svg>
                                                    </a>
                                                ) : null}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="py-8 text-center text-neutral-500">
                                        <svg className="mx-auto mb-2 h-12 w-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <p className="text-xs">No medical certificates uploaded</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="mt-4 rounded-xl border border-alpha/20 bg-light p-4 dark:bg-dark">
                        <Label className="font-semibold text-alpha">Add Note</Label>
                        <form
                            className="mt-3 flex gap-2"
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                const input = form.querySelector('input[name="newNote"]');
                                const value = (input?.value || '').trim();
                                if (!value) return;
                                try {
                                    const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
                                    const res = await fetch(`/admin/users/${user.id}/notes`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'X-CSRF-TOKEN': csrf,
                                            'X-Requested-With': 'XMLHttpRequest',
                                        },
                                        credentials: 'same-origin',
                                        body: JSON.stringify({ note: value }),
                                    });
                                    if (res.ok) {
                                        const r = await fetch(`/admin/users/${user.id}/notes`);
                                        const d = await r.json();
                                        setNotes(Array.isArray(d?.notes) ? d.notes : []);
                                        if (input) input.value = '';
                                    }
                                } catch {}
                            }}
                        >
                            <input
                                name="newNote"
                                type="text"
                                placeholder="Add a note and press Enter"
                                className="flex-1 rounded-md border border-alpha/20 bg-transparent px-3 py-2"
                            />
                            <Button type="submit">Save</Button>
                        </form>

                        {Array.isArray(notes) && notes.length > 0 ? (
                            <ul className="mt-4 space-y-3 text-sm">
                                {notes.map((n, i) => (
                                    <li key={i} className="rounded-lg border border-alpha/20 bg-alpha/5 p-3 transition-colors hover:bg-alpha/10">
                                        <div className="font-medium text-dark dark:text-light">{n.note || n.text}</div>
                                        <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
                                            <span>{new Date(n.created_at).toLocaleString()}</span>
                                            <span>•</span>
                                            <span className="font-medium text-alpha">{n.author}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">No notes yet.</div>
                        )}
                    </div>
                )}

                {/* <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-alpha/10">
                    <Button onClick={close} variant="secondary">Close</Button>
                </div> */}
            </DialogContent>
        </Dialog>
    );
};

export default User;
