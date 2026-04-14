import BookAppointment from '@/components/book-appointment';
import AppLayout from '@/layouts/app-layout';
import ReservationModalCowork from '@/pages/admin/places/coworks/components/ReservationModalCowork';
import ReservationModal from '@/pages/admin/places/studios/components/ReservationModal';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Button } from '@headlessui/react';
import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import CalendarModal from './components/CalendarModal';

const PRIVILEGED_ACCESS_ROLES = ['admin', 'super_admin', 'moderateur', 'coach', 'studio_responsable'];

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'studio', label: 'Studios' },
    { key: 'cowork', label: 'Cowork' },
];

export default function SpacesPage() {
    const {
        studios = [],
        coworks = [],
        meetingRooms = [],
        auth,
        equipmentOptions = [],
        teamMemberOptions = [],
        events: initialEvents = [],
        calendarContext = null,
    } = usePage().props;
    const [type, setType] = useState('all');
    const [modalStudio, setModalStudio] = useState(null);
    const [modalCowork, setModalCowork] = useState(false);
    const [calendarFor, setCalendarFor] = useState(calendarContext);
    const [events, setEvents] = useState(Array.isArray(initialEvents) ? initialEvents : []);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [selectedRange, setSelectedRange] = useState(null);
    const [selectedCoworkId, setSelectedCoworkId] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventExtras, setEventExtras] = useState({ team_members: [], equipments: [] });
    const [blockedTableIds, setBlockedTableIds] = useState([]);
    const [blockedStudioIds, setBlockedStudioIds] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [accessError, setAccessError] = useState('');
    const [accessErrorType, setAccessErrorType] = useState(null); // 'studio' or 'cowork'
    const [selectionError, setSelectionError] = useState('');
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [isExternalReservationModalOpen, setIsExternalReservationModalOpen] = useState(false);
    const [requestingAccess, setRequestingAccess] = useState(false);

    const userRolesRaw = Array.isArray(auth?.user?.role) ? auth.user.role : [auth?.user?.role];
    const normalizedRoles = userRolesRaw.filter(Boolean).map((role) => `${role}`.toLowerCase());

    const resolveAccessFlag = useCallback(
        (key) => {
            const direct = auth?.user?.[key];
            if (direct !== undefined && direct !== null) {
                return Boolean(Number(direct));
            }
            const nested = auth?.user?.access?.[key];
            if (nested !== undefined && nested !== null) {
                return Boolean(Number(nested));
            }
            return false;
        },
        [auth?.user],
    );

    const hasUnlimitedAccess = normalizedRoles.some((role) => PRIVILEGED_ACCESS_ROLES.includes(role));
    const canAccessStudio = hasUnlimitedAccess || resolveAccessFlag('access_studio');
    const canAccessCowork = hasUnlimitedAccess || resolveAccessFlag('access_cowork');

    // Check if user has media field (required for studio access requests)
    const userField = auth?.user?.field ? String(auth.user.field).toLowerCase().trim() : '';
    const isMediaStudent = userField === 'media';

    const requireAccess = useCallback(
        (target) => {
            if (target === 'studio' && !canAccessStudio) {
                if (isMediaStudent) {
                    setAccessError('You do not currently have access to reserve studios. Please contact the staff for assistance.');
                    setAccessErrorType('studio');
                } else {
                    setAccessError(
                        'Studio access requests are only available for students with the "media" field. Please contact the staff if you need studio access.',
                    );
                    setAccessErrorType(null); // Don't allow request access for non-media students
                }
                return false;
            }
            if (target === 'cowork' && !canAccessCowork) {
                setAccessError('You do not currently have access to reserve cowork tables. Please contact the staff for assistance.');
                setAccessErrorType('cowork');
                return false;
            }
            setAccessError('');
            setAccessErrorType(null);
            return true;
        },
        [canAccessStudio, canAccessCowork, isMediaStudent],
    );

    const openStudioModal = useCallback(
        (payload) => {
            if (!requireAccess('studio')) {
                return false;
            }
            setModalStudio(payload);
            return true;
        },
        [requireAccess],
    );

    const openCoworkModal = useCallback(() => {
        if (!requireAccess('cowork')) {
            return false;
        }
        setModalCowork(true);
        return true;
    }, [requireAccess]);

    const breadcrumbs = [{ title: 'Spaces', href: '/students/spaces' }];

    const showStudios = type === 'all' || type === 'studio';
    const showCowork = type === 'all' || type === 'cowork';
    const showMeetingRooms = type === 'all';
    const isCoworkMultiCalendar = type === 'cowork' || (type === 'all' && calendarFor?.place_type === 'cowork');

    const cards = [];
    if (showStudios) {
        studios.forEach((place) => cards.push({ ...place, cardType: 'studio' }));
    }
    if (showCowork) {
        // Show just one "Cowork" card in all tab
        cards.push({
            id: 'cowork-zone',
            name: 'Cowork',
            type: 'cowork',
            image: coworks[0]?.image || '',
            cardType: 'cowork',
            state: coworks.some((c) => c.state),
        });
    }
    if (showMeetingRooms && Array.isArray(meetingRooms)) {
        meetingRooms.forEach((room) => {
            cards.push({
                ...room,
                cardType: 'meeting_room',
                type: 'meeting room',
            });
        });
    }

    const priorityOrder = ['Studio Image', 'Studio Podcast'];
    const orderedCards = (() => {
        if (!cards.length) return [];
        const priority = [];
        const rest = [];
        cards.forEach((card) => {
            if (card.cardType === 'studio' && priorityOrder.includes(card.name)) {
                const priorityIndex = priorityOrder.indexOf(card.name);
                priority[priorityIndex] = card;
            } else {
                rest.push(card);
            }
        });
        return [...priority.filter(Boolean), ...rest];
    })();

    const requestEvents = useCallback(
        (params) => {
            setLoadingEvents(true);
            setEvents([]);
            setEventExtras({ team_members: [], equipments: [] });
            setSelectedEvent(null);
            setBlockedTableIds([]);
            setBlockedStudioIds([]);
            router.get('/students/spaces', params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['events', 'calendarContext'],
                onFinish: () => setLoadingEvents(false),
            });
        },
        [router],
    );

    const rangesOverlap = (startA, endA, startB, endB) => startA < endB && startB < endA;

    const parseDateValue = (value) => {
        if (!value) return null;
        if (value instanceof Date) {
            return value.getTime();
        }
        const date = new Date(value);
        const time = date.getTime();
        return Number.isNaN(time) ? null : time;
    };

    const computeBlockedTables = useCallback(
        (startDate, endDate, sourceEvents = events) => {
            const start = parseDateValue(startDate);
            const end = parseDateValue(endDate);
            if (start === null || end === null) return [];

            const blocked = new Set();
            sourceEvents.forEach((ev) => {
                const tableId = ev.extendedProps?.table_id ?? ev.table_id ?? ev.tableId;
                if (!tableId) return;

                const evStart = parseDateValue(ev.start);
                const evEnd = parseDateValue(ev.end);
                if (evStart === null || evEnd === null) return;

                if (rangesOverlap(evStart, evEnd, start, end)) {
                    blocked.add(Number(tableId));
                }
            });

            return Array.from(blocked);
        },
        [events],
    );

    const computeBlockedStudios = useCallback(
        (startDate, endDate, sourceEvents = events) => {
            const start = parseDateValue(startDate);
            const end = parseDateValue(endDate);
            if (start === null || end === null) return [];

            const blocked = new Set();
            sourceEvents.forEach((ev) => {
                const studioId = ev.extendedProps?.studio_id ?? ev.studio_id ?? ev.studioId;
                if (!studioId) return;

                const evStart = parseDateValue(ev.start);
                const evEnd = parseDateValue(ev.end);
                if (evStart === null || evEnd === null) return;

                if (rangesOverlap(evStart, evEnd, start, end)) {
                    blocked.add(Number(studioId));
                }
            });

            return Array.from(blocked);
        },
        [events],
    );

    const handleStudioTimeChange = useCallback(
        (range) => {
            if (!range?.day || !range?.start || !range?.end) {
                setBlockedStudioIds([]);
                return;
            }
            const start = new Date(`${range.day}T${range.start}`);
            const end = new Date(`${range.day}T${range.end}`);
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
                setBlockedStudioIds([]);
                return;
            }
            setBlockedStudioIds(computeBlockedStudios(start, end));
        },
        [computeBlockedStudios],
    );

    const selectionOverlapsExisting = useCallback(
        (startDate, endDate, sourceEvents = events) => {
            const start = parseDateValue(startDate);
            const end = parseDateValue(endDate);
            if (start === null || end === null) return false;

            return sourceEvents.some((ev) => {
                const evStart = parseDateValue(ev.start);
                const evEnd = parseDateValue(ev.end);
                if (evStart === null || evEnd === null) return false;
                return rangesOverlap(evStart, evEnd, start, end);
            });
        },
        [events],
    );

    const validateSelectionWindow = useCallback((startDate, endDate) => {
        const now = new Date();
        if ((startDate && startDate < now) || (endDate && endDate < now)) {
            setSelectionError('You cannot select dates or times in the past.');
            return false;
        }
        setSelectionError('');
        return true;
    }, []);

    const ensureFutureSelection = useCallback(
        (selectInfo) => {
            if (!selectInfo) return true;
            return validateSelectionWindow(selectInfo.start, selectInfo.end);
        },
        [validateSelectionWindow],
    );

    const activeStudioCalendar =
        calendarFor?.place_type === 'studio' ? calendarFor : calendarContext?.place_type === 'studio' ? calendarContext : null;

    const selectAllowForMainCalendar = useCallback(
        (selectInfo) => {
            if (!ensureFutureSelection(selectInfo)) {
                return false;
            }
            const overlaps = selectionOverlapsExisting(selectInfo.start, selectInfo.end);

            if (activeStudioCalendar && overlaps) {
                return false;
            }
            if (type === 'studio') {
                return canAccessStudio;
            }
            if (type === 'cowork') {
                return canAccessCowork;
            }
            if (type === 'all' && calendarFor?.place_type === 'cowork') {
                return canAccessCowork;
            }
            if (type === 'all' && calendarFor?.place_type === 'studio') {
                return canAccessStudio;
            }
            return !selectionOverlapsExisting(selectInfo.start, selectInfo.end);
        },
        [
            type,
            calendarFor,
            calendarContext,
            selectionOverlapsExisting,
            canAccessCowork,
            canAccessStudio,
            ensureFutureSelection,
            activeStudioCalendar,
        ],
    );

    const selectAllowForModal = useCallback(
        (selectInfo) => {
            if (!ensureFutureSelection(selectInfo)) {
                return false;
            }
            const overlaps = selectionOverlapsExisting(selectInfo.start, selectInfo.end);
            if (calendarFor?.place_type === 'studio' && overlaps) {
                return false;
            }
            if (calendarFor?.place_type === 'cowork') {
                return canAccessCowork;
            }
            if (calendarFor?.place_type === 'studio') {
                return canAccessStudio;
            }
            return !selectionOverlapsExisting(selectInfo.start, selectInfo.end);
        },
        [calendarFor, selectionOverlapsExisting, canAccessCowork, canAccessStudio, ensureFutureSelection],
    );

    function handleCardClick(card) {
        if (card.cardType === 'studio') {
            if (!requireAccess('studio')) {
                return;
            }
            const context = { place_type: 'studio', id: card.id, name: card.name };
            setSelectedRange(null);
            setCalendarFor(context);
            setBlockedTableIds([]);
            setBlockedStudioIds([]);
            requestEvents({
                events_mode: 'place',
                event_type: 'studio',
                event_id: card.id,
            });
        } else if (card.cardType === 'cowork') {
            if (!requireAccess('cowork')) {
                return;
            }
            const context = { place_type: 'cowork', id: null, name: 'Cowork' };
            setSelectedRange(null);
            setCalendarFor(context);
            setBlockedTableIds([]);
            setBlockedStudioIds([]);
            requestEvents({
                events_mode: 'cowork_all',
            });
        } else if (card.cardType === 'meeting_room') {
            const context = { place_type: 'meeting_room', id: card.id, name: card.name };
            setSelectedRange(null);
            setCalendarFor(context);
            setBlockedTableIds([]);
            setBlockedStudioIds([]);
            requestEvents({
                events_mode: 'place',
                event_type: 'meeting_room',
                event_id: card.id,
            });
        }
    }

    function handleStudioSuccess() {
        setModalStudio(null);
        setBlockedStudioIds([]);
        router.reload();
    }

    function handleCoworkSuccess() {
        setModalCowork(false);
        setBlockedTableIds([]);
        setBlockedStudioIds([]);
        router.reload();
    }

    useEffect(() => {
        if (type === 'studio') {
            setCalendarFor(null);
            if (studios.length) {
                requestEvents({ events_mode: 'studio_all' });
            } else {
                setEvents([]);
            }
        } else if (type === 'cowork') {
            setCalendarFor(null);
            if (coworks.length) {
                requestEvents({ events_mode: 'cowork_all' });
            } else {
                setEvents([]);
            }
        } else if (type === 'all') {
            setLoadingEvents(false);
            setEvents([]);
        }
    }, [type, studios, coworks, requestEvents]);

    useEffect(() => {
        if (!isCoworkMultiCalendar) {
            setBlockedTableIds([]);
        }
    }, [isCoworkMultiCalendar]);

    useEffect(() => {
        if (type !== 'studio') {
            setBlockedStudioIds([]);
        }
    }, [type]);

    useEffect(() => {
        setEvents(Array.isArray(initialEvents) ? initialEvents : []);
        if (calendarContext) {
            setCalendarFor(calendarContext);
        }
    }, [initialEvents, calendarContext]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleRequestAccess = async (accessType) => {
        if (requestingAccess) return;

        setRequestingAccess(true);
        try {
            const response = await fetch('/access-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    access_type: accessType,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Access request submitted successfully! An admin will review your request.');
            } else {
                alert(data.error || 'Failed to submit access request. Please try again.');
            }
        } catch (error) {
            console.error('Error requesting access:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setRequestingAccess(false);
        }
    };

    const onCalendarDateSelect = (selectInfo) => {
        if (type === 'studio' && !canAccessStudio) {
            requireAccess('studio');
            return;
        }
        if (type === 'cowork' && !canAccessCowork) {
            requireAccess('cowork');
            return;
        }
        const start = selectInfo.start;
        const end = selectInfo.end;
        if (!validateSelectionWindow(start, end)) {
            return;
        }
        const day = start.toISOString().split('T')[0];
        const startTime = start.toTimeString().slice(0, 5);
        const endTime = end.toTimeString().slice(0, 5);
        setSelectedRange({ day, start: startTime, end: endTime });
        if (type === 'cowork') {
            setBlockedTableIds(computeBlockedTables(start, end));
            setBlockedStudioIds([]);
        } else if (type === 'studio') {
            setBlockedStudioIds(computeBlockedStudios(start, end));
            setBlockedTableIds([]);
        } else {
            setBlockedTableIds([]);
            setBlockedStudioIds([]);
        }

        if (type === 'all' && calendarFor) {
            if (calendarFor.place_type === 'studio') {
                // For all tab, directly open reservation modal
                openStudioModal({ id: calendarFor.id, name: calendarFor.name, cardType: 'studio' });
                return;
            }
            if (calendarFor.place_type === 'cowork') {
                openCoworkModal();
                return;
            }
        }

        // For studio and cowork tabs, directly open modal if selection exists
        if (type === 'studio') {
            openStudioModal({ id: null, name: '', cardType: 'studio' });
            return;
        }
        if (type === 'cowork') {
            // For cowork, always open modal - table selection is inside the modal
            openCoworkModal();
            return;
        }
    };

    useEffect(() => {
        if (type === 'cowork') {
            setSelectedCoworkId(null);
        } else if (type === 'all') {
            setCalendarFor(null);
            setSelectedRange(null);
        }
        setModalStudio(null);
        setModalCowork(false);
    }, [type]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="relative mx-auto max-w-7xl px-6 py-4">
                {loadingEvents && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-6 text-center shadow-2xl dark:bg-neutral-900">
                            <svg className="h-10 w-10 animate-spin text-[#FFC801]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Loading calendar…</p>
                        </div>
                    </div>
                )}

                {accessError && (
                    <div className="mb-4 flex items-start justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-100">
                        <span className="flex-1">{accessError}</span>
                        <div className="ml-4 flex items-center gap-2">
                            {accessErrorType && isMediaStudent && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleRequestAccess(accessErrorType);
                                        setAccessError('');
                                        setAccessErrorType(null);
                                    }}
                                    className="rounded-lg bg-alpha px-4 py-2 text-sm font-semibold whitespace-nowrap text-black transition hover:bg-alpha/90"
                                >
                                    Request Access
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setAccessError('');
                                    setAccessErrorType(null);
                                }}
                                className="text-red-500 hover:text-red-700 dark:text-red-200 dark:hover:text-white"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                )}

                {selectionError && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-100">
                        {selectionError}
                    </div>
                )}

                {type === 'studio' && !canAccessStudio && (
                    <div className="mb-4 flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700/60 dark:bg-yellow-900/30 dark:text-yellow-100">
                        <span>
                            {isMediaStudent
                                ? 'You currently do not have studio reservation access. Please contact the staff if you believe this is an error.'
                                : 'Studio access requests are only available for students with the "media" field. Please contact the staff if you need studio access.'}
                        </span>
                        {isMediaStudent && (
                            <button
                                onClick={() => handleRequestAccess('studio')}
                                className="ml-4 rounded-lg bg-alpha px-4 py-2 font-semibold text-black transition hover:bg-alpha/90"
                            >
                                Request Access
                            </button>
                        )}
                    </div>
                )}
                {type === 'cowork' && !canAccessCowork && (
                    <div className="mb-4 flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700/60 dark:bg-yellow-900/30 dark:text-yellow-100">
                        <span>You currently do not have cowork reservation access. Please contact the staff if you need access.</span>
                        <button
                            onClick={() => handleRequestAccess('cowork')}
                            className="ml-4 rounded-lg bg-alpha px-4 py-2 font-semibold text-black transition hover:bg-alpha/90"
                        >
                            Request Access
                        </button>
                    </div>
                )}

                <div className="mb-6 flex justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Spaces</h1>
                        <p className="mt-1 hidden text-sm text-muted-foreground md:block">
                            Browse available studios and cowork tables, or open a calendar to reserve.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button className="h-fit rounded-lg bg-alpha px-2 py-2 text-black" onClick={() => setIsExternalReservationModalOpen(true)}>
                            External Reservation
                        </Button>
                        <Button className="h-fit rounded-lg bg-alpha px-2 py-2 text-black" onClick={() => setIsAppointmentModalOpen(true)}>
                            Book an appointment
                        </Button>
                    </div>
                </div>

                <div className="mx-3 mb-6 inline-flex w-[94%] items-center justify-center rounded-xl border border-neutral-200 bg-white/95 p-1 shadow-sm backdrop-blur-lg md:w-fit dark:border-neutral-800 dark:bg-neutral-900/95">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                type === tab.key
                                    ? 'text-alpha dark:text-alpha'
                                    : 'text-neutral-600 hover:text-alpha dark:text-neutral-400 dark:hover:text-alpha'
                            }`}
                            onClick={() => setType(tab.key)}
                        >
                            {tab.label}
                            {type === tab.key && <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-alpha dark:bg-white"></div>}
                        </button>
                    ))}
                </div>

                {type === 'all' ? (
                    <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {cards.length === 0 && (
                            <div className="text-md col-span-full py-8 text-center text-gray-500">No locations to reserve found for this type.</div>
                        )}
                        {orderedCards.map((place) => (
                            <div
                                key={place.id}
                                onClick={() => handleCardClick(place)}
                                className="group relative aspect-[4/2] w-full cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-sidebar-border/70"
                            >
                                {place.image ? (
                                    <img
                                        src={place.image}
                                        alt={place.name}
                                        className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-125"
                                    />
                                ) : (
                                    <div className="absolute inset-0 grid place-items-center text-gray-400">No Image</div>
                                )}
                                <div className="absolute top-3 left-3 flex items-center gap-2">
                                    <span
                                        className={`rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-gray-900 capitalize backdrop-blur`}
                                    >
                                        {place.type}
                                    </span>
                                </div>
                                <div className="absolute top-3 right-3">
                                    <span
                                        className={`inline-flex items-center rounded-full border border-white/30 px-2.5 py-1 text-[11px] font-semibold shadow-sm ${place.state ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}
                                    >
                                        {place.state ? 'Available' : 'Busy'}
                                    </span>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4">
                                    <div className="line-clamp-1 text-start font-semibold text-white drop-shadow-sm">{place.name}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-gray-200 bg-light p-5 shadow-sm dark:border-sidebar-border/70 dark:bg-dark">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold md:text-lg">{type === 'studio' ? 'Studio Calendar' : 'Cowork Calendar'}</div>

                            <button
                                className="ml-auto rounded-md border border-alpha bg-alpha px-4 py-2 text-sm font-semibold text-black hover:bg-alpha/90"
                                onClick={() => {
                                    if (type === 'studio') {
                                        if (!openStudioModal({ id: null, name: '', cardType: 'studio' })) {
                                            return;
                                        }
                                        setBlockedStudioIds([]);
                                    } else if (type === 'cowork') {
                                        if (!openCoworkModal()) {
                                            return;
                                        }
                                        setBlockedTableIds([]);
                                    }
                                }}
                            >
                                Add Reservation
                            </button>
                        </div>
                        {loadingEvents ? (
                            <div className="flex h-[60vh] items-center justify-center">Loading events...</div>
                        ) : (
                            <div className="h-[70vh] bg-light dark:bg-dark">
                                <FullCalendar
                                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                    initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
                                    initialDate={isMobile ? new Date() : undefined}
                                    headerToolbar={{
                                        left: 'prev,next today',
                                        center: 'title',
                                        right: isMobile ? '' : 'dayGridMonth,timeGridWeek,timeGridDay',
                                    }}
                                    events={events}
                                    selectable={true}
                                    selectMirror={true}
                                    selectAllow={selectAllowForMainCalendar}
                                    select={onCalendarDateSelect}
                                    eventClick={(info) => {
                                        const e = info.event;

                                        // Extract time slot from event
                                        const start = e.start;
                                        const end = e.end;
                                        if (start && end) {
                                            const day = start.toISOString().split('T')[0];
                                            const startTime = start.toTimeString().slice(0, 5);
                                            const endTime = end.toTimeString().slice(0, 5);
                                            setSelectedRange({ day, start: startTime, end: endTime });

                                            // For cowork, extract table ID from event title or extendedProps
                                            if (type === 'cowork') {
                                                const conflicts = computeBlockedTables(start, end);
                                                setBlockedTableIds(conflicts);
                                                // Open modal to reserve another table
                                                if (!openCoworkModal()) {
                                                    return;
                                                }
                                            } else if (type === 'studio') {
                                                if (e.extendedProps?.user_id === auth?.user?.id && e.id) {
                                                    router.visit(`/students/reservations/${e.id}/details`);
                                                    return;
                                                }
                                                const conflicts = computeBlockedStudios(start, end);
                                                setBlockedStudioIds(conflicts);
                                                if (!openStudioModal({ id: null, name: '', cardType: 'studio' })) {
                                                    return;
                                                }
                                            } else {
                                                // For studio, navigate to details page only if user owns the reservation
                                                if (e.extendedProps?.user_id === auth?.user?.id && e.id) {
                                                    router.visit(`/students/reservations/${e.id}/details`);
                                                }
                                            }
                                        }
                                    }}
                                    selectOverlap={true}
                                    editable={false}
                                    height="100%"
                                    eventColor="#FFC801"
                                    eventTextColor="#000000"
                                    slotMinTime="08:00:00"
                                    slotMaxTime="18:30:00"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Calendar Modal - For 'all' tab */}
                {type === 'all' && calendarFor && (
                    <CalendarModal
                        isOpen={!!calendarFor}
                        onClose={() => {
                            setCalendarFor(null);
                            setBlockedTableIds([]);
                            setBlockedStudioIds([]);
                        }}
                        calendarFor={calendarFor}
                        events={events}
                        loadingEvents={loadingEvents}
                        selectAllow={selectAllowForModal}
                        onDateSelect={(selectInfo) => {
                            const start = selectInfo.start;
                            const end = selectInfo.end;
                            const day = start.toISOString().split('T')[0];
                            const startTime = start.toTimeString().slice(0, 5);
                            const endTime = end.toTimeString().slice(0, 5);
                            setSelectedRange({ day, start: startTime, end: endTime });

                            if (calendarFor.place_type === 'studio') {
                                setBlockedTableIds([]);
                                openStudioModal({ id: calendarFor.id, name: calendarFor.name, cardType: 'studio' });
                            } else if (calendarFor.place_type === 'cowork') {
                                setBlockedTableIds(computeBlockedTables(start, end));
                                openCoworkModal();
                            }
                        }}
                        onEventClick={(info) => {
                            const e = info.event;

                            // For studio reservations, navigate to details page only if user owns it
                            if (calendarFor?.place_type === 'studio' && e.extendedProps?.user_id === auth?.user?.id && e.id) {
                                router.visit(`/students/reservations/${e.id}/details`);
                                return;
                            }

                            // For other cases, show event details only if user owns it
                            if (e.extendedProps?.user_id !== auth?.user?.id) {
                                return;
                            }
                            const extras = {
                                team_members: Array.isArray(e.extendedProps?.team_members) ? e.extendedProps.team_members : [],
                                equipments: Array.isArray(e.extendedProps?.equipments) ? e.extendedProps.equipments : [],
                            };
                            setSelectedEvent({
                                id: e.id,
                                title: e.title,
                                start: e.start?.toISOString?.() || e.start,
                                end: e.end?.toISOString?.() || e.end,
                                backgroundColor: e.backgroundColor,
                                ...extras,
                            });
                            setEventExtras(extras);
                        }}
                        onAddReservationClick={() => {
                            const now = new Date();
                            const day = now.toISOString().split('T')[0];
                            const startTime = now.toTimeString().slice(0, 5);
                            const endDate = new Date(now.getTime() + 60 * 60 * 1000);
                            const endTime = endDate.toTimeString().slice(0, 5);
                            setSelectedRange({ day, start: startTime, end: endTime });

                            if (calendarFor.place_type === 'studio') {
                                openStudioModal({ id: calendarFor.id, name: calendarFor.name, cardType: 'studio' });
                            } else if (calendarFor.place_type === 'cowork') {
                                setBlockedTableIds([]);
                                openCoworkModal();
                            }
                        }}
                    />
                )}

                {/* Cowork Reservation Modal */}
                {modalCowork && (
                    <ReservationModalCowork
                        key="cowork-modal"
                        isOpen={modalCowork}
                        onClose={() => {
                            setModalCowork(false);
                            setBlockedTableIds([]);
                        }}
                        cowork={selectedRange && selectedCoworkId ? coworks.find((c) => c.id === selectedCoworkId) : null}
                        selectedRange={selectedRange}
                        coworks={coworks
                            .filter((t) => t.state)
                            .map((c) => ({
                                id: c.id,
                                table: c.name?.replace('Table ', '') || c.id,
                                state: c.state,
                                image: c.image,
                            }))}
                        onSuccess={() => {
                            handleCoworkSuccess();
                            setBlockedTableIds([]);
                        }}
                        allowMultiple={true}
                        blockedTableIds={blockedTableIds}
                    />
                )}

                {/* Studio Reservation Modal */}
                {modalStudio && (
                    <ReservationModal
                        isOpen={!!modalStudio}
                        onClose={() => setModalStudio(null)}
                        studio={type === 'studio' ? null : { id: modalStudio.id || calendarFor?.id, name: modalStudio.name || calendarFor?.name }}
                        selectedRange={selectedRange}
                        onSuccess={handleStudioSuccess}
                        studios={type === 'studio' ? studios : []}
                        equipmentOptions={equipmentOptions}
                        teamMemberOptions={teamMemberOptions}
                        blockedStudioIds={type === 'studio' ? blockedStudioIds : []}
                        onTimeChange={type === 'studio' ? handleStudioTimeChange : undefined}
                        userRouteMode
                    />
                )}

                {/* External Reservation Modal */}
                {isExternalReservationModalOpen && (
                    <ReservationModal
                        isOpen={isExternalReservationModalOpen}
                        onClose={() => setIsExternalReservationModalOpen(false)}
                        studio={null}
                        selectedRange={selectedRange}
                        onSuccess={() => {
                            setIsExternalReservationModalOpen(false);
                            router.reload();
                        }}
                        studios={[]}
                        equipmentOptions={equipmentOptions}
                        teamMemberOptions={teamMemberOptions}
                        blockedStudioIds={[]}
                        isExternal={true}
                        userRouteMode
                    />
                )}

                {/* Book Appointment Modal */}
                <BookAppointment isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} />
            </div>
        </AppLayout>
    );
}
