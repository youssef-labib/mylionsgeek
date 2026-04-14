import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogPanel, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';

const APPOINTMENT_PERSONS = ['Mahdi Bouziane', 'Hamid Boumehraz', 'Amina Khabab', 'Ayman Boujjar'];

export default function BookAppointment({ isOpen, onClose, onSuccess }) {
    const [step, setStep] = useState(1);
    const [selectedPerson, setSelectedPerson] = useState('');
    const [day, setDay] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleNext = () => {
        setError('');
        if (!selectedPerson) {
            setError('Please select a person for the appointment');
            return;
        }
        setStep(2);
    };

    const handleBack = () => {
        setError('');
        setStep(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!day || !start || !end) {
            setError('Please fill in all date and time fields');
            setLoading(false);
            return;
        }

        // Validate that end time is after start time
        const startTime = new Date(`${day}T${start}`);
        const endTime = new Date(`${day}T${end}`);
        if (endTime <= startTime) {
            setError('End time must be after start time');
            setLoading(false);
            return;
        }

        // Validate that the date is not in the past
        const now = new Date();
        if (startTime < now) {
            setError('You cannot book appointments in the past');
            setLoading(false);
            return;
        }

        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            const response = await fetch('/appointments/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    person: selectedPerson,
                    day: day,
                    start: start,
                    end: end,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data?.message || 'Failed to book appointment');
                setLoading(false);
                return;
            }

            // Success - show success message
            alert(data?.message || "Appointment request sent successfully! You will receive an email once it's approved or canceled.");

            if (onSuccess) {
                onSuccess({ person: selectedPerson, day, start, end });
            }

            // Reset and close
            resetForm();
            onClose();
        } catch (err) {
            setError('An error occurred while booking the appointment');
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setSelectedPerson('');
        setDay('');
        setStart('');
        setEnd('');
        setError('');
        setLoading(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-50"
                onClose={() => {
                    // Prevent automatic closing
                }}
            >
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                {/* Modal Panel */}
                <div className="pointer-events-none fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <DialogPanel
                            className="pointer-events-auto w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="mb-6 flex items-center justify-between">
                                <Dialog.Title className="text-xl font-bold">Book an Appointment</Dialog.Title>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleClose();
                                    }}
                                    className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                                    aria-label="Close"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Progress Indicator */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between">
                                    <div className={`flex items-center ${step >= 1 ? 'text-alpha' : 'text-gray-400'}`}>
                                        <div
                                            className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? 'bg-alpha text-black' : 'bg-gray-200 dark:bg-neutral-700'}`}
                                        >
                                            {step > 1 ? '✓' : '1'}
                                        </div>
                                        <span className="ml-2 text-sm font-medium">Select Person</span>
                                    </div>
                                    <div className="mx-4 h-0.5 flex-1 bg-gray-200 dark:bg-neutral-700">
                                        <div
                                            className={`h-full transition-all ${step >= 2 ? 'bg-alpha' : ''}`}
                                            style={{ width: step >= 2 ? '100%' : '0%' }}
                                        ></div>
                                    </div>
                                    <div className={`flex items-center ${step >= 2 ? 'text-alpha' : 'text-gray-400'}`}>
                                        <div
                                            className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? 'bg-alpha text-black' : 'bg-gray-200 dark:bg-neutral-700'}`}
                                        >
                                            2
                                        </div>
                                        <span className="ml-2 text-sm font-medium">Date & Time</span>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <form className="space-y-6" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                                {step === 1 ? (
                                    <>
                                        <div>
                                            <Label className="mb-3 block text-base font-medium">Select a person for your appointment</Label>
                                            <div className="space-y-2">
                                                {APPOINTMENT_PERSONS.map((person) => (
                                                    <label
                                                        key={person}
                                                        className={`flex cursor-pointer items-center rounded-lg border-2 p-4 transition-all ${
                                                            selectedPerson === person
                                                                ? 'border-alpha bg-alpha/10 dark:bg-alpha/20'
                                                                : 'border-gray-200 bg-white hover:border-alpha/50 dark:border-neutral-700 dark:bg-neutral-800'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="appointmentPerson"
                                                            value={person}
                                                            checked={selectedPerson === person}
                                                            onChange={(e) => setSelectedPerson(e.target.value)}
                                                            className="h-4 w-4 border-gray-300 text-alpha focus:ring-alpha dark:border-neutral-600"
                                                        />
                                                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">{person}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20">
                                                {error}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-3 pt-4">
                                            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                                                Cancel
                                            </Button>
                                            <Button type="button" onClick={handleNext} className="flex-1 bg-alpha text-black hover:bg-alpha/90">
                                                Next
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <Label className="mb-3 block text-base font-medium">Selected Person</Label>
                                            <div className="rounded-lg border border-alpha/30 bg-alpha/10 p-3 dark:bg-alpha/20">
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedPerson}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <Label htmlFor="day">Date</Label>
                                                <input
                                                    id="day"
                                                    type="date"
                                                    value={day}
                                                    onChange={(e) => setDay(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-alpha focus:outline-none dark:bg-neutral-800"
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="start">Start Time</Label>
                                                    <input
                                                        id="start"
                                                        type="time"
                                                        value={start}
                                                        onChange={(e) => setStart(e.target.value)}
                                                        className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-alpha focus:outline-none dark:bg-neutral-800"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="end">End Time</Label>
                                                    <input
                                                        id="end"
                                                        type="time"
                                                        value={end}
                                                        onChange={(e) => setEnd(e.target.value)}
                                                        className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-alpha focus:outline-none dark:bg-neutral-800"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20">
                                                {error}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-3 pt-4">
                                            <Button type="button" variant="outline" onClick={handleBack} className="flex-1" disabled={loading}>
                                                Back
                                            </Button>
                                            <Button type="submit" className="flex-1 bg-alpha text-black hover:bg-alpha/90" disabled={loading}>
                                                {loading ? 'Booking...' : 'Book Appointment'}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </form>
                        </DialogPanel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
