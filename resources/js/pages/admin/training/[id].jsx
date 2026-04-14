import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, CalendarCheck, Play, ChevronDown, BookOpen, Award, QrCode, RefreshCw } from 'lucide-react';
import { Users, CalendarDays, User, Trash2, Plus, UserPlus, Settings } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
// Use native fetch instead of axios
import GeekyWheel from './partials/geekyWheel';
import RolesMultiSelect from '@/pages/admin/users/partials/RolesMultiSelect';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import ExercicesModal from "@/components/EXP'S/exersices_modal";
import CoursesModal from "@/components/EXP'S/courses_modal";

export default function Show({ training, usersNull, courses = [] }) {
    const { auth } = usePage().props;
    const userRoles = Array.isArray(auth?.user?.role) ? auth.user.role : [auth?.user?.role].filter(Boolean);
    const isCoachRole = userRoles.includes('coach');
    const isTrainingCoach = auth?.user?.id && training?.coach?.id ? auth.user.id === training.coach.id : false;
    const trainingStatus = String(training?.status || '').toLowerCase();
    const isActiveTraining = !trainingStatus || trainingStatus === 'active';
    const [students, setStudents] = useState(training.users || []);
    const [availableUsers, setAvailableUsers] = useState(usersNull || []);
    const [filter, setFilter] = useState('');
    const [modalFilter, setModalFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAttendance, setShowAttendance] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState(null);
    const [showAttendanceList, setShowAttendanceList] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [attendanceData, setAttendanceData] = useState({});
    const [events, setEvents] = useState([]);
    const [currentAttendanceId, setCurrentAttendanceId] = useState(null);
    const [showPlayDropdown, setShowPlayDropdown] = useState(false);
    const [showGeekyWheel, setShowGeekyWheel] = useState(false);
    const [wheelParticipants, setWheelParticipants] = useState([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [selectedWinner, setSelectedWinner] = useState(null);
    const [wheelRotation, setWheelRotation] = useState(0);
    const [showWinnerModal, setShowWinnerModal] = useState(false);
    const dropdownRef = useRef(null);
    const calendarRef = useRef(null);
    const [calendarApi, setCalendarApi] = useState(null);
    const [calendarTitle, setCalendarTitle] = useState('');
    const [calendarError, setCalendarError] = useState('');
    const [hasAttendanceToday, setHasAttendanceToday] = useState(false);
    const [reminderModal, setReminderModal] = useState({ open: false, slot: null });
    const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [bulkRoles, setBulkRoles] = useState([]);
    const [bulkStatus, setBulkStatus] = useState('');
    const [qrCodeDate, setQrCodeDate] = useState(new Date().toISOString().split('T')[0]);



    // Map status to color styles for SelectTrigger
    const statusClass = (value) => {
        const v = String(value || '').toLowerCase();
        if (v === 'present') return 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400';
        if (v === 'absent') return 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400';
        if (v === 'late') return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-alpha';
        if (v === 'excused') return 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400';
        return '';
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowPlayDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Initialize FullCalendar API once mounted
    useEffect(() => {
        if (calendarRef.current && typeof calendarRef.current.getApi === 'function') {
            setCalendarApi(calendarRef.current.getApi());
        }
    }, [calendarRef]);

    // Fetch attendance events for this training
    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch(`/training/${training.id}/attendance-events`);
                const data = await res.json();
                if (Array.isArray(data.events)) {
                    setEvents(data.events.map(e => ({ ...e })));
                }
            } catch (e) { }
        }
        fetchEvents();
    }, [training.id]);

    useEffect(() => {
        const todayStr = new Date().toISOString().slice(0, 10);
        const hasToday = events.some((event) => {
            if (!event?.date) return false;
            try {
                return new Date(event.date).toISOString().slice(0, 10) === todayStr;
            } catch {
                return false;
            }
        });
        setHasAttendanceToday(hasToday);
        if (hasToday && reminderModal.open) {
            setReminderModal({ open: false, slot: null });
        }
    }, [events, reminderModal.open]);

    useEffect(() => {
        if (!isCoachRole || !isTrainingCoach || !isActiveTraining) return;
        const checkReminder = () => {
            if (hasAttendanceToday || typeof window === 'undefined') {
                return;
            }
            const now = new Date();
            const todayStr = now.toISOString().slice(0, 10);
            const thresholds = [
                { hour: 11, key: 'morning', label: '11:00 AM' },
                { hour: 15, key: 'afternoon', label: '03:00 PM' },
            ];

            for (const threshold of thresholds) {
                if (now.getHours() >= threshold.hour) {
                    const storageKey = `attendance-reminder-${training.id}-${todayStr}-${threshold.key}`;
                    if (!localStorage.getItem(storageKey)) {
                        localStorage.setItem(storageKey, 'shown');
                        setReminderModal({ open: true, slot: threshold });
                        break;
                    }
                }
            }
        };

        checkReminder();
        const interval = setInterval(checkReminder, 60 * 1000);
        return () => clearInterval(interval);
    }, [isCoachRole, isTrainingCoach, isActiveTraining, hasAttendanceToday, training.id]);

    //   attendance


    async function AddAttendance(dateStr) {
        try {
            const csrf =
            document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            const res = await fetch('/attendances', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrf,
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                formation_id: training.id,
                attendance_day: dateStr,
            }),
            });

            if (!res.ok) {
            throw new Error(`Failed to create/load attendance (${res.status})`);
            }

            const data = await res.json();

            setCurrentAttendanceId(data.attendance_id);

            const initialized = {};
            const existing = data.lists || [];
            const byUserId = new Map(existing.map((l) => [l.user_id, l]));

            students.forEach((s) => {
            const key = `${dateStr}-${s.id}`;
            const saved = byUserId.get(s.id);
            const base = getDefaultSlots(s);

            initialized[key] = {
                morning: saved?.morning ?? base.morning,
                lunch: saved?.lunch ?? base.lunch,
                evening: saved?.evening ?? base.evening,
                notes: saved?.note
                ? String(saved.note).split(' | ').filter(Boolean)
                : base.notes,
                user_id: s.id,
            };
            });

            setAttendanceData((prev) => ({ ...prev, ...initialized }));

            if (existing.length === 0) {
            const dataToSave = students.map((s) => {
                const base = getDefaultSlots(s);
                return {
                user_id: s.id,
                attendance_day: dateStr,
                attendance_id: Number(data.attendance_id),
                morning: base.morning,
                lunch: base.lunch,
                evening: base.evening,
                note: null,
                };
            });

            fetch('/admin/attendance/save', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrf,
                'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ attendance: dataToSave }),
            }).catch(() => {});
            }

            setShowAttendanceList(true);
        } catch (err) {
        }
        }


    //   atteandacelist
    async function handleSave() {
        const dataToSave = Object.entries(attendanceData).map(([key, value]) => {
            const studentId = value?.user_id ?? (() => { const i = key.lastIndexOf('-'); return i !== -1 ? key.slice(i + 1) : key; })();
            return {
                user_id: studentId,
                attendance_day: selectedDate,
                attendance_id: Number(currentAttendanceId),
                morning: value.morning,
                lunch: value.lunch,
                evening: value.evening,
                note: Array.isArray(value.notes) ? value.notes.join(' | ') : (value.notes || null),
            };
        });

        try {
            if (!currentAttendanceId || !selectedDate) return;
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch('/admin/attendance/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ attendance: dataToSave }),
            });
            if (!res.ok) return;
            setShowAttendanceList(false);
            try {
                const evRes = await fetch(`/training/${training.id}/attendance-events`);
                const evData = await evRes.json();
                if (Array.isArray(evData.events)) setEvents(evData.events);
            } catch { }
        } catch (err) { }
    }

    // Wheel functions
    const openGeekyWheel = () => {
        setWheelParticipants([...students]);
        setSelectedWinner(null);
        setWheelRotation(0);
        setShowGeekyWheel(true);
        setShowPlayDropdown(false);
    };

    const spinWheel = () => {
        if (isSpinning || wheelParticipants.length === 0) return;

        setIsSpinning(true);
        setSelectedWinner(null);

        // Random rotation between 1800-3600 degrees (5-10 full rotations)
        const randomRotation = 1800 + Math.random() * 1800;
        const finalRotation = wheelRotation + randomRotation;

        setWheelRotation(finalRotation);

        setTimeout(() => {
            const segmentAngle = 360 / wheelParticipants.length;
            const normalizedRotation = finalRotation % 360;
            // Arrow is at 180 degrees (9 o'clock position - left side)
            // Calculate which segment the arrow is pointing to
            const winnerIndex = Math.floor((360 - normalizedRotation + 180) / segmentAngle) % wheelParticipants.length;

            setSelectedWinner(wheelParticipants[winnerIndex]);
            setIsSpinning(false);
            setShowWinnerModal(true);
        }, 5000);
    };

    const removeWinner = () => {
        if (selectedWinner) {
            setWheelParticipants(prev => prev.filter(p => p.id !== selectedWinner.id));
            setSelectedWinner(null);
            setShowWinnerModal(false);
        }
    };

    const resetWheel = () => {
        setWheelParticipants([...students]);
        setSelectedWinner(null);
        setWheelRotation(0);
        setShowWinnerModal(false);
    };

    const continueSpinning = () => {
        setSelectedWinner(null);
        setShowWinnerModal(false);
    };

    const getDefaultSlots = (student) => {
    const status = String(student?.status || '').toLowerCase();
    if (status === 'left') {
        return { morning: 'absent', lunch: 'absent', evening: 'absent', notes: [] };
    }
    return { morning: 'present', lunch: 'present', evening: 'present', notes: [] };
    };
    // Notes helpers: add/remove chip-style notes per student
    const addNote = (studentKey, noteText) => {
    const text = (noteText || '').trim();
    if (!text) return;

    setAttendanceData((prev) => {
        const student = students.find((s) => s.id === studentKey);
        const base = getDefaultSlots(student);
        const prevForStudent = prev[studentKey] || base;

        const existingNotes = Array.isArray(prevForStudent.notes)
        ? prevForStudent.notes
        : (prevForStudent.notes ? [prevForStudent.notes] : []);

        return {
        ...prev,
        [studentKey]: {
            ...prevForStudent,
            notes: [...existingNotes, text],
        },
        };
    });
    };


    const removeNote = (studentKey, index) => {
    setAttendanceData((prev) => {
        const student = students.find((s) => s.id === studentKey);
        const base = getDefaultSlots(student);
        const prevForStudent = prev[studentKey] || base;

        const existingNotes = Array.isArray(prevForStudent.notes)
        ? [...prevForStudent.notes]
        : (prevForStudent.notes ? [prevForStudent.notes] : []);

        existingNotes.splice(index, 1);

        return {
        ...prev,
        [studentKey]: {
            ...prevForStudent,
            notes: existingNotes,
        },
        };
    });
    };
    // Filter enrolled students
    const filteredStudents = students.filter(
        s =>
            s.name.toLowerCase().includes(filter.toLowerCase()) ||
            s.email.toLowerCase().includes(filter.toLowerCase())
    );

    // Filter available users to exclude admins, coaches, and already assigned students
    const filteredAvailableUsers = availableUsers.filter(user => {
        // Exclude admins (assuming role field exists)
        if (user.role.includes('admin') || user.role.includes('moderateur')) return false;

        // Exclude coaches (assuming role field exists)
        if (user.role.includes('coach')) return false;

        // Exclude users already assigned to this training
        const isAlreadyAssigned = students.some(student => student.id === user.id);
        if (isAlreadyAssigned) return false;

        // Apply search filter
        if (modalFilter) {
            const searchTerm = modalFilter.toLowerCase();
            if (!user.name.toLowerCase().includes(searchTerm)) return false;
        }

        return true;
    });

    // Delete student


    // Add student from modal
    const handleAddStudent = (user) => {
        router.post(`/trainings/${training.id}/students`, { student_id: user.id }, {
            onSuccess: () => {
                setStudents(prev => [...prev, user]);
                setAvailableUsers(prev => prev.filter(u => u.id !== user.id));
            }
        });
    };
    const handleDelete = (userId) => {
        const student = students.find(s => s.id === userId);
        setStudentToDelete(student);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (studentToDelete) {
            router.delete(`/trainings/${training.id}/students/${studentToDelete.id}`, {
                onSuccess: () => {
                    setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
                    setAvailableUsers(prev => [...prev, studentToDelete]);
                    setShowDeleteConfirm(false);
                    setStudentToDelete(null);
                }
            });
        }
    };


    return (
        <AppLayout>
            <Head title={training.name} />

            <div className="p-6 min-h-screen">
                {/* Header */}
                <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-light leading-tight break-words">
                            {training.name}
                        </h1>
                        <p className="text-dark/70 mt-1 sm:mt-2 dark:text-light/70">{training.category}</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <ExercicesModal trainingId={training.id} courses={courses} />
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="gap-2 bg-[var(--color-alpha)] text-black border border-[var(--color-alpha)] hover:bg-transparent hover:text-[var(--color-alpha)] flex-1 sm:flex-none"
                        >
                            <Plus size={16} />
                            <span>Add Student</span>
                        </Button>
                        <Button
                            onClick={() => setShowAttendance(true)}
                            className="gap-2 bg-[var(--color-alpha)] text-black border border-[var(--color-alpha)] hover:bg-transparent hover:text-[var(--color-alpha)] flex-1 sm:flex-none"
                        >
                            <CalendarCheck size={16} />
                            <span>Attendance</span>
                        </Button>
                        <Button
                            onClick={() => setShowBulkUpdateModal(true)}
                            className="gap-2 bg-[var(--color-alpha)] text-black border border-[var(--color-alpha)] hover:bg-transparent hover:text-[var(--color-alpha)] flex-1 sm:flex-none"
                        >
                            <Settings size={16} />
                            <span>Update Users</span>
                        </Button>

                        {/* Play Dropdown */}
                        <div className="relative flex-1 sm:flex-initial" ref={dropdownRef}>
                            <Button
                                onClick={() => setShowPlayDropdown(!showPlayDropdown)}
                                className="gap-2 bg-[var(--color-alpha)] text-black border border-[var(--color-alpha)] hover:bg-transparent hover:text-[var(--color-alpha)] transition-all duration-300 w-full sm:w-auto"
                            >
                                <Play size={16} />
                                <span className="hidden sm:inline">Play</span>
                                <ChevronDown size={16} className={`transform transition-transform duration-300 ${showPlayDropdown ? 'rotate-180' : ''}`} />
                            </Button>

                            {showPlayDropdown && (
                                <div className="absolute right-0 mt-2 w-full sm:w-48 bg-light text-dark dark:bg-dark dark:text-light border border-alpha/20 rounded-xl shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
                                    <button
                                        onClick={openGeekyWheel}
                                        className="w-full text-left px-4 py-3 hover:bg-alpha/10 rounded-t-xl transition-colors text-dark dark:text-light font-semibold"
                                    >
                                        Geeky Wheel
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowPlayDropdown(false);
                                            router.visit(`/training/${training.id}/geeko`);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-alpha/10 rounded-b-xl transition-colors text-dark dark:text-light font-semibold"
                                    >
                                        Geeko
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Hero Image */}
                <div className="w-full h-64 rounded-2xl overflow-hidden border border-alpha/20 mb-8">
                    {training.img ? (
                        <img
                            src={
                                training.category?.toLowerCase() === "coding"
                                    ? "/assets/images/training/coding.jpg"
                                    : training.category?.toLowerCase() === "media"
                                        ? "/assets/images/training/media.jpg"
                                        : training.img
                                            ? `/storage/img/training/${training.img}`
                                            : "/assets/images/training/default.jpg"
                            }
                            alt={training.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-alpha to-alpha/70 flex items-center justify-center text-light font-bold text-xl">
                            {training.name}
                        </div>
                    )}
                </div>

                {/* Courses Section */}
                <div className="bg-light text-dark dark:bg-dark dark:text-light rounded-2xl border border-alpha/20 p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">
                            Courses ({courses.length})
                        </h2>
                        <CoursesModal />
                    </div>
                    
                    {courses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {courses.map((course) => (
                                <div key={course.id} className="bg-light/50 dark:bg-dark/50 rounded-xl border border-alpha/10 p-4 hover:border-alpha/30 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-semibold text-lg text-dark dark:text-light">
                                                {course.name}
                                            </h3>
                                            {course.description && (
                                                <p className="text-sm text-dark/70 dark:text-light/70 mt-1 line-clamp-2">
                                                    {course.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Badges Display */}
                                    <div className="flex items-center gap-2 mt-3">
                                        {course.badge1 && (
                                            <img 
                                                src={`/storage/img/courses/${course.badge1}`} 
                                                alt="Badge 1" 
                                                className="w-8 h-8 rounded-full object-cover border border-alpha/20"
                                            />
                                        )}
                                        {course.badge2 && (
                                            <img 
                                                src={`/storage/img/courses/${course.badge2}`} 
                                                alt="Badge 2" 
                                                className="w-8 h-8 rounded-full object-cover border border-alpha/20"
                                            />
                                        )}
                                        {course.badge3 && (
                                            <img 
                                                src={`/storage/img/courses/${course.badge3}`} 
                                                alt="Badge 3" 
                                                className="w-8 h-8 rounded-full object-cover border border-alpha/20"
                                            />
                                        )}
                                        {!course.badge1 && !course.badge2 && !course.badge3 && (
                                            <div className="w-8 h-8 rounded-full bg-alpha/10 flex items-center justify-center">
                                                <Award className="w-4 h-4 text-alpha" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Exercises Count */}
                                    {course.exercices && course.exercices.length > 0 && (
                                        <div className="mt-3 text-xs text-dark/60 dark:text-light/60">
                                            {course.exercices.length} exercise{course.exercices.length > 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-alpha/10 flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-alpha" />
                            </div>
                            <p className="text-dark/70 dark:text-light/70">
                                No courses assigned to this training yet.
                            </p>
                            <p className="text-sm text-dark/50 dark:text-light/50 mt-1">
                                Add exercises and assign them to courses to see them here.
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Side – Students List */}
                    <div className="lg:col-span-2 space-y-6">
                        {students.length > 0 && (
                            <div className="bg-light text-dark dark:bg-dark dark:text-light rounded-2xl border border-alpha/20 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold">
                                        Enrolled Students ({students.length})
                                    </h2>
                                </div>

                                {/* Filter Input */}
                                <Input
                                    type="text"
                                    placeholder="Filter by name or email..."
                                    value={filter}
                                    onChange={e => setFilter(e.target.value)}
                                    className="mb-6"
                                />

                                <ul className="space-y-3">
                                    {filteredStudents.map(user => (
                                        <li key={user.id} className="flex items-center justify-between space-x-3">
                                            <div
                                                className="flex items-center space-x-3 cursor-pointer hover:bg-alpha/5 p-2 rounded-lg transition-colors flex-1"
                                                onClick={() => router.visit(`/admin/users/${user.id}`)}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-alpha text-black flex items-center justify-center font-bold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-dark dark:text-light">{user.name}</p>
                                                    <p className="text-sm text-dark/70 dark:text-light/70">{user.email}</p>
                                                    <button
                                                        className="mt-1 inline-block text-red-600 hover:text-red-700 text-xs md:hidden"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(user.id);
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleDelete(user.id)}
                                                className="hidden md:inline-flex gap-1 px-3 py-1 text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                            >
                                                Remove
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Right Side – Info */}
                    <div className="space-y-6">
                        {/* Coach Card */}
                        <div className="bg-light dark:bg-dark rounded-2xl border border-alpha/20 p-6 flex items-center space-x-4">
                            <div className="w-14 h-14 rounded-full bg-alpha flex items-center justify-center text-black font-bold text-lg">
                                {training.coach
                                    ? training.coach.name.split(' ').map(n => n[0]).join('').toUpperCase()
                                    : 'C'}
                            </div>
                            <div>
                                <p className="font-bold text-dark dark:text-light">{training.coach?.name || 'Expert Instructor'}</p>
                                <p className="text-sm text-dark/70 dark:text-light/70">{training.coach?.speciality || 'Professional Mentor'}</p>
                            </div>
                        </div>

                        {/* Course Info */}
                        <div className="bg-light dark:bg-dark rounded-2xl border border-alpha/20 p-6 space-y-4">
                            <div className="flex items-center space-x-3">
                                <CalendarDays className="text-alpha" />
                                <div>
                                    <p className="text-sm text-dark/70 dark:text-light/70">Start Time</p>
                                    <p className="font-bold text-dark dark:text-light">{training.start_time || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <Users className="text-alpha" />
                                <div>
                                    <p className="text-sm text-dark/70 dark:text-light/70">Enrolled Students</p>
                                    <p className="font-bold text-dark dark:text-light">{students.length}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <User className="text-alpha" />
                                <div>
                                    <p className="text-sm text-dark/70 dark:text-light/70">Max Participants</p>
                                    <p className="font-bold text-dark dark:text-light">{training.max_participants || 'Unlimited'}</p>
                                </div>
                            </div>
                        </div>

                        {/* QR Code Card */}
                        {(isCoachRole || isTrainingCoach) && (
                            <div className="bg-light dark:bg-dark rounded-2xl border border-alpha/20 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <QrCode className="text-alpha" size={20} />
                                        <h3 className="text-lg font-bold text-dark dark:text-light">Attendance QR Code</h3>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setQrCodeDate(new Date().toISOString().split('T')[0])}
                                        className="gap-1 h-8 px-2"
                                    >
                                        <RefreshCw size={14} />
                                    </Button>
                                </div>
                                <div className="flex flex-col items-center space-y-3">
                                    <div className="bg-white dark:bg-dark_gray p-4 rounded-xl border border-alpha/20 [&_svg]:dark:invert">
                                        <QRCode
                                            value={JSON.stringify({
                                                training_id: training.id,
                                                date: qrCodeDate
                                            })}
                                            size={200}
                                            level="M"
                                            bgColor="#FFFFFF"
                                            fgColor="#000000"
                                        />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-semibold text-dark dark:text-light">
                                            {training.name}
                                        </p>
                                        <p className="text-xs text-dark/70 dark:text-light/70">
                                            Date: {new Date(qrCodeDate).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-xs text-dark/50 dark:text-light/50 mt-2">
                                            Scan with mobile app to mark attendance
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Status */}
                        {training.status && (
                            <div className="bg-light dark:bg-dark rounded-2xl border border-alpha/20 p-4 text-center">
                                <span className="px-4 py-2 rounded-full text-sm font-bold bg-alpha/10 text-alpha">
                                    {training.status.toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal for adding students */}

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-lg bg-light text-dark dark:bg-dark dark:text-light border border-alpha/20">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">Add Student</DialogTitle>
                        </DialogHeader>

                        {/* Search Filter */}
                        <div className="mt-4">
                            <Input
                                type="text"
                                placeholder="Search by name..."
                                value={modalFilter}
                                onChange={e => setModalFilter(e.target.value)}
                            />
                        </div>

                        <div className="mt-4 max-h-96 overflow-y-auto">
                            <div className="space-y-2">
                                {filteredAvailableUsers.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-dark/50 dark:text-light/60">
                                        No available students
                                    </div>
                                ) : (
                                    filteredAvailableUsers.map(user => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between p-3 border border-alpha/20 rounded-lg hover:border-alpha/40 transition-colors cursor-pointer"
                                            onClick={() => router.visit(`/students/${user.id}`)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-alpha text-black flex items-center justify-center font-bold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-dark dark:text-light">{user.name}</p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddStudent(user);
                                                }}
                                                variant="outline"
                                                className="inline-flex items-center gap-2 px-3 py-1 font-semibold text-sm"
                                            >
                                                <UserPlus size={16} />
                                                Add
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="mt-4 text-right">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Attendance Modal with FullCalendar */}
                <Dialog open={showAttendance} onOpenChange={setShowAttendance}>
                    <DialogContent className="w-full max-w-full sm:max-w-[95vw] lg:max-w-[1100px] h-[100svh] sm:h-auto overflow-y-auto overflow-x-hidden bg-light text-dark dark:bg-dark dark:text-light border border-alpha/20 flex flex-col gap-4 sm:gap-5 p-4 sm:p-6 md:p-8 rounded-none sm:rounded-2xl shadow-xl">

                        {/* Header */}
                        <DialogHeader>
                            <DialogTitle className="text-3xl lg:text-4xl font-extrabold text-dark dark:text-light">
                                Training Attendance Calendar
                            </DialogTitle>
                            <p className="text-dark/70 dark:text-light/70 text-lg lg:text-xl">
                                Click on any day to manage attendance for that date
                            </p>
                        </DialogHeader>

                        {/* Calendar */}
                        {/* Custom calendar toolbar */}
                        <div className="flex flex-col gap-3">
                            <div className="text-center text-sm sm:text-base md:text-lg font-semibold">{calendarTitle}</div>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" onClick={() => calendarApi && calendarApi.prev()} className="p-2">
                                        <ChevronLeft size={16} />
                                    </Button>
                                    <Button variant="outline" onClick={() => calendarApi && calendarApi.today()} className="px-3">
                                        Today
                                    </Button>
                                    <Button variant="outline" onClick={() => calendarApi && calendarApi.next()} className="p-2">
                                        <ChevronRight size={16} />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        className="bg-[var(--color-alpha)] text-black border border-[var(--color-alpha)] hover:bg-transparent hover:text-[var(--color-alpha)]"
                                        onClick={() => {
                                            const api = calendarApi || (calendarRef.current && typeof calendarRef.current.getApi === 'function' ? calendarRef.current.getApi() : null);
                                            if (api && typeof api.changeView === 'function') {
                                                api.changeView('dayGridMonth');
                                                if (typeof api.today === 'function') {
                                                    api.today();
                                                }
                                            }
                                        }}
                                    >
                                        Month
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div
                            className="bg-light text-dark dark:bg-dark dark:text-light rounded-xl border border-alpha/20 p-2 sm:p-3 md:p-4 shadow-sm overflow-y-auto overflow-x-auto"
                            style={{ height: 'calc(100svh - 260px)' }}
                        >
                            {calendarError && (
                                <div className="mb-3 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:border-yellow-700/60 dark:bg-yellow-900/40 dark:text-yellow-100">
                                    {calendarError}
                                </div>
                            )}
                            <FullCalendar
                                ref={(el) => {
                                    calendarRef.current = el;
                                    if (el && typeof el.getApi === 'function') {
                                        const api = el.getApi();
                                        if (api !== calendarApi) setCalendarApi(api);
                                    }
                                }}
                                plugins={[dayGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                selectable={true}
                                selectMirror={true}
                                editable={true}
                                events={events}
                                datesSet={(arg) => setCalendarTitle(arg.view.title)}
                                eventClick={(info) => {
                                    const eventDate = info?.event?.start;
                                    const dateStr = info?.event?.startStr || info?.event?._instance?.range?.start?.toISOString()?.slice(0, 10);
                                    if (!dateStr) return;

                                    setCalendarError('');
                                    setSelectedDate(dateStr);
                                    AddAttendance(dateStr);
                                    setShowAttendance(false);
                                    setShowAttendanceList(true);
                                }}
                                dateClick={(info) => {

                                    setCalendarError('');
                                    setSelectedDate(info.dateStr);
                                    AddAttendance(info.dateStr);
                                    setShowAttendance(false);
                                    setShowAttendanceList(true);
                                }}

                                height="100%"
                                headerToolbar={{ left: '', center: '', right: '' }}
                                dayMaxEvents={true}
                                moreLinkClick="popover"
                                eventDisplay="block"
                                eventTextColor="#000000"
                                dayCellClassNames="hover:bg-alpha/10 cursor-pointer transition-colors duration-200 rounded-md"
                                dayHeaderClassNames="bg-secondary/50 text-dark dark:text-light font-semibold text-[13px]"
                                todayClassNames="bg-alpha/20 border border-alpha/60"
                                dayCellContent={(info) => (
                                    <div className="flex items-center justify-center h-full font-semibold text-dark dark:text-light">
                                        {info.dayNumberText}
                                    </div>
                                )}
                                dayHeaderContent={(info) => (
                                    <div className="text-center font-bold text-dark dark:text-light">
                                        {info.text}
                                    </div>
                                )}
                            />
                        </div>

                        {/* Legend removed to allow calendar more vertical space */}
                    </DialogContent>
                </Dialog>

                {/* Attendance List Modal */}
                <Dialog open={showAttendanceList} onOpenChange={setShowAttendanceList}>
                    <DialogContent className="w-full max-w-full sm:max-w-[95vw] lg:max-w-[1150px] h-[100svh] sm:h-auto overflow-y-auto overflow-x-hidden bg-light text-dark dark:bg-dark dark:text-light border border-alpha/20 p-4 sm:p-5 md:p-6 rounded-none sm:rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl md:text-3xl font-extrabold text-dark dark:text-light">
                                Attendance for {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </DialogTitle>
                            <p className="text-dark/70 dark:text-light/70 text-sm md:text-base">Mark attendance for each student</p>
                        </DialogHeader>
                        <div className="mt-4">
                            <div className="bg-light text-dark dark:bg-dark dark:text-light rounded-xl border border-alpha/20 h-[52vh] overflow-y-auto overflow-x-hidden shadow-sm -ml-3 md:-ml-4">
                                {/* Mobile cards layout */}
                                <div className="block md:hidden p-3 pr-4 space-y-3">
                                    {students.map((student) => {
                                        const studentKey = `${selectedDate}-${student.id}`;
                                        const currentData = attendanceData[studentKey] || {
                                            morning: 'present',
                                            lunch: 'present',
                                            evening: 'present',
                                            notes: '',
                                        };
                                        return (
                                            <div key={student.id} className="rounded-lg border border-alpha/20 p-3">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-9 h-9 rounded-full bg-alpha text-black flex items-center justify-center font-bold">
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-dark dark:text-light truncate">{student.name}</p>
                                                        <p className="text-xs text-dark/70 dark:text-light/70 truncate">{student.email}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <Select
                                                        value={currentData.morning ?? 'present'}
                                                        onValueChange={(val) => {
                                                            const newData = { ...currentData, morning: val };
                                                            setAttendanceData(prev => ({ ...prev, [studentKey]: newData }));
                                                        }}
                                                    >
                                                        <SelectTrigger className={`h-10 rounded-xl text-sm border ${statusClass(currentData.morning ?? 'present') || 'border-alpha/30'}`}>
                                                            <SelectValue placeholder="9:30 - 11:00" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="present">Present</SelectItem>
                                                            <SelectItem value="absent">Absent</SelectItem>
                                                            <SelectItem value="late">Late</SelectItem>
                                                            <SelectItem value="excused">Excused</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    <Select
                                                        value={currentData.lunch ?? 'present'}
                                                        onValueChange={(val) => {
                                                            const newData = { ...currentData, lunch: val };
                                                            setAttendanceData(prev => ({ ...prev, [studentKey]: newData }));
                                                        }}
                                                    >
                                                        <SelectTrigger className={`h-10 rounded-xl text-sm border ${statusClass(currentData.lunch ?? 'present') || 'border-alpha/30'}`}>
                                                            <SelectValue placeholder="11:30 - 13:00" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="present">Present</SelectItem>
                                                            <SelectItem value="absent">Absent</SelectItem>
                                                            <SelectItem value="late">Late</SelectItem>
                                                            <SelectItem value="excused">Excused</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    <Select
                                                        value={currentData.evening ?? 'present'}
                                                        onValueChange={(val) => {
                                                            const newData = { ...currentData, evening: val };
                                                            setAttendanceData(prev => ({ ...prev, [studentKey]: newData }));
                                                        }}
                                                    >
                                                        <SelectTrigger className={`h-10 rounded-xl text-sm border ${statusClass(currentData.evening ?? 'present') || 'border-alpha/30'}`}>
                                                            <SelectValue placeholder="14:00 - 17:00" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="present">Present</SelectItem>
                                                            <SelectItem value="absent">Absent</SelectItem>
                                                            <SelectItem value="late">Late</SelectItem>
                                                            <SelectItem value="excused">Excused</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-alpha/30 bg-light dark:bg-dark p-2">
                                                        {Array.isArray(currentData.notes) && currentData.notes.map((n, idx) => (
                                                            <span key={idx} className="inline-flex items-center gap-2 rounded-full bg-secondary/50 px-3 py-1 text-xs">
                                                                {n}
                                                                <button
                                                                    type="button"
                                                                    className="text-red-500 hover:text-red-600"
                                                                    onClick={() => removeNote(studentKey, idx)}
                                                                >
                                                                    ×
                                                                </button>
                                                            </span>
                                                        ))}
                                                        <div className="flex w-full sm:w-auto items-center gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Add note"
                                                                className="flex-1 bg-transparent text-sm outline-hidden"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        addNote(studentKey, e.currentTarget.value);
                                                                        e.currentTarget.value = '';
                                                                    }
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="px-3 py-1 rounded-md bg-alpha/10 text-black dark:text-black hover:bg-alpha/20 text-xs font-medium transition-colors"
                                                                onClick={(e) => {
                                                                    const input = (e.currentTarget.previousElementSibling);
                                                                    const val = input && 'value' in input ? input.value : '';
                                                                    addNote(studentKey, val);
                                                                    if (input && 'value' in input) input.value = '';
                                                                }}
                                                            >Add</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Desktop table */}
                                <div className="hidden md:block">
                                    <div className="overflow-x-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-secondary/50 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-light">Student</th>
                                                    <th className="px-4 py-3 text-center font-semibold text-dark dark:text-light">9:30 - 11:00</th>
                                                    <th className="px-4 py-3 text-center font-semibold text-dark dark:text-light">11:30 - 13:00</th>
                                                    <th className="px-4 py-3 text-center font-semibold text-dark dark:text-light">14:00 - 17:00</th>
                                                    <th className="px-4 py-3 text-center font-semibold text-dark dark:text-light">Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-alpha/10">
                                                {students.map((student) => {
                                                    const studentKey = `${selectedDate}-${student.id}`;
                                                    const currentData = attendanceData[studentKey] || {
                                                        morning: 'present',
                                                        lunch: 'present',
                                                        evening: 'present',
                                                        notes: '',
                                                    };
                                                    return (
                                                        <tr key={student.id} className="hover:bg-accent/30 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="w-10 h-10 rounded-full bg-alpha text-black flex items-center justify-center font-bold">
                                                                        {student.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-base text-dark dark:text-light">{student.name}</p>
                                                                        <p className="text-xs md:text-sm text-dark/70 dark:text-light/70">{student.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <div className="inline-block min-w-[150px]">
                                                                    <Select
                                                                        value={currentData.morning ?? 'present'}
                                                                        onValueChange={(val) => {
                                                                            const newData = { ...currentData, morning: val };
                                                                            setAttendanceData(prev => ({ ...prev, [studentKey]: newData }));
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className={`h-10 rounded-xl text-sm border focus:ring-[var(--color-alpha)]/40 ${statusClass(currentData.morning ?? 'present') || 'border-alpha/30'}`}>
                                                                            <SelectValue placeholder="Morning" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="present">Present</SelectItem>
                                                                            <SelectItem value="absent">Absent</SelectItem>
                                                                            <SelectItem value="late">Late</SelectItem>
                                                                            <SelectItem value="excused">Excused</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <div className="inline-block min-w-[150px]">
                                                                    <Select
                                                                        value={currentData.lunch ?? 'present'}
                                                                        onValueChange={(val) => {
                                                                            const newData = { ...currentData, lunch: val };
                                                                            setAttendanceData(prev => ({ ...prev, [studentKey]: newData }));
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className={`h-10 rounded-xl text-sm border focus:ring-[var(--color-alpha)]/40 ${statusClass(currentData.lunch ?? 'present') || 'border-alpha/30'}`}>
                                                                            <SelectValue placeholder="11:30 - 13:00" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="present">Present</SelectItem>
                                                                            <SelectItem value="absent">Absent</SelectItem>
                                                                            <SelectItem value="late">Late</SelectItem>
                                                                            <SelectItem value="excused">Excused</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <div className="inline-block min-w-[150px]">
                                                                    <Select
                                                                        value={currentData.evening ?? 'present'}
                                                                        onValueChange={(val) => {
                                                                            const newData = { ...currentData, evening: val };
                                                                            setAttendanceData(prev => ({ ...prev, [studentKey]: newData }));
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className={`h-10 rounded-xl text-sm border focus:ring-[var(--color-alpha)]/40 ${statusClass(currentData.evening ?? 'present') || 'border-alpha/30'}`}>
                                                                            <SelectValue placeholder="14:00 - 17:00" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="present">Present</SelectItem>
                                                                            <SelectItem value="absent">Absent</SelectItem>
                                                                            <SelectItem value="late">Late</SelectItem>
                                                                            <SelectItem value="excused">Excused</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </td>

                                                            <td className="px-4 py-3 text-center">
                                                                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-alpha/30 bg-light dark:bg-dark px-2 py-2 text-sm">
                                                                    {Array.isArray(currentData.notes) && currentData.notes.map((n, idx) => (
                                                                        <span key={idx} className="inline-flex items-center gap-2 rounded-full bg-secondary/50 px-3 py-1 text-xs">
                                                                            {n}
                                                                            <button
                                                                                type="button"
                                                                                className="text-red-500 hover:text-red-600"
                                                                                onClick={() => removeNote(studentKey, idx)}
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        </span>
                                                                    ))}
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Add note"
                                                                        className="flex-1 bg-transparent outline-hidden"
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                e.preventDefault();
                                                                                addNote(studentKey, e.currentTarget.value);
                                                                                e.currentTarget.value = '';
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            </td>


                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-light dark:bg-dark border-t border-alpha/20 mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center pr-3 md:pr-6 py-3">
                            <div className="text-sm md:text-base text-dark/70 dark:text-light/70">
                                Total Students: <span className="font-bold text-xl">{students.length}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:space-x-4 gap-2 sm:gap-0">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAttendanceList(false)}
                                    className="px-6 py-2 w-full sm:w-auto"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        // Save attendance logic here
                                        handleSave();
                                    }}
                                    className="px-6 py-2 bg-[var(--color-alpha)] text-black border border-[var(--color-alpha)] hover:bg-transparent hover:text-[var(--color-alpha)] w-full sm:w-auto"
                                >
                                    Save Attendance
                                </Button>
                            </div>
                        </div>

                    </DialogContent>
                </Dialog>

                <GeekyWheel
                    setShowWinnerModal={setShowWinnerModal}
                    showGeekyWheel={showGeekyWheel}
                    setShowGeekyWheel={setShowGeekyWheel}
                    wheelParticipants={wheelParticipants}
                    isSpinning={isSpinning}
                    selectedWinner={selectedWinner}
                    continueSpinning={continueSpinning}
                    resetWheel={resetWheel}
                    removeWinner={removeWinner}
                    showWinnerModal={showWinnerModal}
                    spinWheel={spinWheel}
                    wheelRotation={wheelRotation}

                />
                {/* Delete Confirmation Modal */}
                <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <DialogContent className="max-w-md bg-light text-dark dark:bg-dark dark:text-light border border-alpha/20">
                        <DialogHeader>
                            <DialogTitle className="text-lg">Confirm Deletion</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                            <p className="text-dark/70 dark:text-light/70">
                                Are you sure you want to remove <strong>{studentToDelete?.name}</strong> from this training?
                            </p>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                            <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmDelete}>Remove Student</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Bulk Update Users Modal */}
                <Dialog open={showBulkUpdateModal} onOpenChange={setShowBulkUpdateModal}>
                    <DialogContent className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-light text-dark dark:bg-dark dark:text-light border border-alpha/20">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">Update Users - {training.name}</DialogTitle>
                            <p className="text-sm text-dark/70 dark:text-light/70">
                                Select users and update their roles and/or status
                            </p>
                        </DialogHeader>

                        <div className="space-y-6 mt-4">
                            {/* Select All Checkbox */}
                            <div className="flex items-center space-x-2 pb-3 border-b border-alpha/20">
                                <Checkbox
                                    id="select-all"
                                    checked={selectedUserIds.length === students.length && students.length > 0}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedUserIds(students.map(s => s.id));
                                        } else {
                                            setSelectedUserIds([]);
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="select-all"
                                    className="text-sm font-medium cursor-pointer"
                                >
                                    Select All ({students.length} users)
                                </label>
                            </div>

                            {/* Users List with Checkboxes */}
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {students.map((student) => (
                                    <div
                                        key={student.id}
                                        className="flex items-center space-x-3 p-3 rounded-lg border border-alpha/20 hover:bg-alpha/5 transition-colors"
                                    >
                                        <Checkbox
                                            id={`user-${student.id}`}
                                            checked={selectedUserIds.includes(student.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedUserIds([...selectedUserIds, student.id]);
                                                } else {
                                                    setSelectedUserIds(selectedUserIds.filter(id => id !== student.id));
                                                }
                                            }}
                                        />
                                        <div className="flex items-center space-x-3 flex-1">
                                            <div className="w-10 h-10 rounded-full bg-alpha text-black flex items-center justify-center font-bold">
                                                {student.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-dark dark:text-light">{student.name}</p>
                                                <p className="text-xs text-dark/70 dark:text-light/70">{student.email}</p>
                                                <div className="text-xs text-dark/60 dark:text-light/60 mt-1">
                                                    Role: {Array.isArray(student.role) ? student.role.join(', ') : student.role || 'N/A'} |
                                                    Status: {student.status || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Update Options */}
                            {selectedUserIds.length > 0 && (
                                <div className="space-y-4 pt-4 border-t border-alpha/20">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Update Roles (optional)</label>
                                        <RolesMultiSelect
                                            roles={bulkRoles}
                                            onChange={setBulkRoles}
                                        />
                                        <p className="text-xs text-dark/60 dark:text-light/60 mt-1">
                                            Leave empty to keep existing roles
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Update Status (optional)</label>
                                        <Select value={bulkStatus || undefined} onValueChange={(value) => setBulkStatus(value === 'keep-existing' ? '' : value)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select status (optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="keep-existing">Keep existing status</SelectItem>
                                                <SelectItem value="Working">Working</SelectItem>
                                                <SelectItem value="Studying">Studying</SelectItem>
                                                <SelectItem value="Internship">Internship</SelectItem>
                                                <SelectItem value="Unemployed">Unemployed</SelectItem>
                                                <SelectItem value="Freelancing">Freelancing</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-alpha/20">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowBulkUpdateModal(false);
                                    setSelectedUserIds([]);
                                    setBulkRoles([]);
                                    setBulkStatus('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    if (selectedUserIds.length === 0) {
                                        return;
                                    }

                                    const formData = {
                                        user_ids: selectedUserIds,
                                    };

                                    if (bulkRoles.length > 0) {
                                        formData.roles = bulkRoles;
                                    }

                                    if (bulkStatus && bulkStatus !== 'keep-existing') {
                                        formData.status = bulkStatus;
                                    }

                                    router.post(`/trainings/${training.id}/bulk-update-users`, formData, {
                                        onSuccess: () => {
                                            setShowBulkUpdateModal(false);
                                            setSelectedUserIds([]);
                                            setBulkRoles([]);
                                            setBulkStatus('');
                                        },
                                        onError: (errors) => {
                                            console.error('Update error:', errors);
                                        },
                                    });
                                }}
                                disabled={selectedUserIds.length === 0 || (bulkRoles.length === 0 && (!bulkStatus || bulkStatus === 'keep-existing'))}
                                className="bg-[var(--color-alpha)] text-black border border-[var(--color-alpha)] hover:bg-transparent hover:text-[var(--color-alpha)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Update {selectedUserIds.length} User{selectedUserIds.length !== 1 ? 's' : ''}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* <Dialog
          open={reminderModal.open}
          onOpenChange={(open) => setReminderModal((prev) => ({ open, slot: open ? prev.slot : null }))}
        >
          <DialogContent className="w-full max-w-md bg-light text-dark dark:bg-dark dark:text-light border border-alpha/20">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Attendance Reminder</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mb-4">
              It&apos;s past {reminderModal.slot?.label}. Don&apos;t forget to submit today&apos;s attendance for {training.name}.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                className="flex-1 bg-[var(--color-alpha)] text-black hover:bg-transparent hover:text-[var(--color-alpha)]"
                onClick={() => {
                  const todayStr = new Date().toISOString().slice(0, 10);
                  setReminderModal({ open: false, slot: null });
                  setSelectedDate(todayStr);
                  AddAttendance(todayStr);
                  setShowAttendance(false);
                  setShowAttendanceList(true);
                }}
              >
                Go to Attendance
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setReminderModal({ open: false, slot: null })}
              >
                Later
              </Button>
            </div>
          </DialogContent>
        </Dialog> */}

            </div>
        </AppLayout>
    );
}
