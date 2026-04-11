import InputError from '@/components/input-error';
import { router, useForm } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { helpers } from './utils/helpers';

// Constants for form options
const MONTHS = [
    { value: '', label: 'Month' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

// Generate years array (50 years back from current year)
const generateYears = () => {
    const currentYear = new Date().getFullYear();
    return [
        { value: '', label: 'Year' },
        ...Array.from({ length: 50 }, (_, i) => ({
            value: String(currentYear - i),
            label: String(currentYear - i),
        })),
    ];
};

const YEARS = generateYears();

const CreateEducationModal = ({ onOpen, onOpenChange }) => {
    const [currentlyStudying, setCurrentlyStudying] = useState(false);
    const [dateError, setDateError] = useState('');
    const [error, setError] = useState(null);
    const { stopScrolling } = helpers();
    const { data, setData, processing, errors } = useForm({
        school: '',
        degree: '',
        fieldOfStudy: '',
        startMonth: '',
        startYear: '',
        endMonth: '',
        endYear: '',
        description: '',
    });

    useEffect(() => {
        stopScrolling(onOpen);
        return () => stopScrolling(false);
    }, [onOpen]);

    // Validate date range
    useEffect(() => {
        if (!currentlyStudying && data.startMonth && data.startYear && data.endMonth && data.endYear) {
            const startDate = new Date(parseInt(data.startYear), parseInt(data.startMonth) - 1);
            const endDate = new Date(parseInt(data.endYear), parseInt(data.endMonth) - 1);

            if (startDate > endDate) {
                setDateError('End date must be after start date');
            } else {
                setDateError('');
            }
        } else {
            setDateError('');
        }
    }, [data.startMonth, data.startYear, data.endMonth, data.endYear, currentlyStudying]);

    const createEducation = (id) => {
        // Check if there's a date validation error
        if (dateError) {
            return;
        }

        try {
            router.post(`/students/education`, data, {
                onSuccess: () => {
                    onOpenChange(false);
                },
                onError: (error) => {
                    setError(error);
                },
            });
        } catch (error) {
            //console.log(error);
        }
    };

    const handleChange = (e) => {
        setData({
            ...data,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <>
            <div
                onClick={() => onOpenChange(false)}
                className="fixed inset-0 z-30 h-full bg-black/50 backdrop-blur-md transition-all duration-300 dark:bg-black/70"
            ></div>
            <div className="fixed inset-0 top-1/2 z-50 mx-auto flex h-fit w-[95%] -translate-y-1/2 flex-col overflow-hidden rounded-lg bg-light sm:w-[90%] md:w-[70%] lg:w-[50%] xl:w-[45%] dark:bg-beta">
                <div className="max-h-[90vh] w-full overflow-y-auto rounded-lg bg-light shadow-2xl dark:bg-dark">
                    {/* Header */}
                    <div className="sticky top-0 flex items-center justify-between border-b border-beta/20 bg-light p-4 dark:border-light/10 dark:bg-dark">
                        <h2 className="text-xl font-semibold text-beta dark:text-light">Add education</h2>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="text-beta/60 transition-colors hover:text-beta dark:text-light/60 dark:hover:text-light"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-6 p-6">
                        {/* School */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-beta dark:text-light">School*</label>
                            <input
                                type="text"
                                name="school"
                                value={data.school}
                                onChange={handleChange}
                                placeholder="Ex: Harvard University"
                                className="w-full rounded border border-beta/30 bg-light px-3 py-2 text-beta placeholder:text-beta/50 focus:border-alpha focus:ring-1 focus:ring-alpha focus:outline-none dark:border-light/20 dark:bg-dark_gray dark:text-light dark:placeholder:text-light/50"
                            />
                            <InputError message={error?.school} className="mt-1" />
                            {/* {console.log(error.school)} */}
                        </div>

                        {/* Degree */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-beta dark:text-light">Degree</label>
                            <input
                                type="text"
                                name="degree"
                                value={data.degree}
                                onChange={handleChange}
                                placeholder="Ex: Bachelor's"
                                className="w-full rounded border border-beta/30 bg-light px-3 py-2 text-beta placeholder:text-beta/50 focus:border-alpha focus:ring-1 focus:ring-alpha focus:outline-none dark:border-light/20 dark:bg-dark_gray dark:text-light dark:placeholder:text-light/50"
                            />
                            <InputError message={error?.degree} className="mt-1" />
                        </div>

                        {/* Field of Study */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-beta dark:text-light">Field of study</label>
                            <input
                                type="text"
                                name="fieldOfStudy"
                                value={data.fieldOfStudy}
                                onChange={handleChange}
                                placeholder="Ex: Computer Science"
                                className="w-full rounded border border-beta/30 bg-light px-3 py-2 text-beta placeholder:text-beta/50 focus:border-alpha focus:ring-1 focus:ring-alpha focus:outline-none dark:border-light/20 dark:bg-dark_gray dark:text-light dark:placeholder:text-light/50"
                            />
                            <InputError message={error?.fieldOfStudy} className="mt-1" />
                        </div>

                        {/* Currently Studying Checkbox */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="currently-studying"
                                checked={currentlyStudying}
                                onChange={(e) => setCurrentlyStudying(e.target.checked)}
                                className="h-4 w-4 rounded border-beta/30 bg-light text-alpha focus:ring-2 focus:ring-alpha dark:border-light/20 dark:bg-dark_gray"
                            />
                            <label htmlFor="currently-studying" className="cursor-pointer text-sm text-beta dark:text-light">
                                I am currently studying here
                            </label>
                        </div>

                        {/* Start Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-beta dark:text-light">Start date*</label>
                                <select
                                    name="startMonth"
                                    value={data.startMonth}
                                    onChange={handleChange}
                                    className="w-full rounded border border-beta/30 bg-light px-3 py-2 text-beta focus:border-alpha focus:ring-1 focus:ring-alpha focus:outline-none dark:border-light/20 dark:bg-dark_gray dark:text-light"
                                >
                                    {MONTHS.map((month) => (
                                        <option key={month.value} value={month.value}>
                                            {month.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={error?.startMonth} className="mt-1" />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-beta opacity-0 dark:text-light">Year</label>
                                <select
                                    name="startYear"
                                    value={data.startYear}
                                    onChange={handleChange}
                                    className="w-full rounded border border-beta/30 bg-light px-3 py-2 text-beta focus:border-alpha focus:ring-1 focus:ring-alpha focus:outline-none dark:border-light/20 dark:bg-dark_gray dark:text-light"
                                >
                                    {YEARS.map((year) => (
                                        <option key={year.value} value={year.value}>
                                            {year.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={error?.startYear} className="mt-1" />
                            </div>
                        </div>

                        {/* End Date */}
                        {!currentlyStudying && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-beta dark:text-light">End date (or expected)*</label>
                                    <select
                                        name="endMonth"
                                        value={data.endMonth}
                                        onChange={handleChange}
                                        className="w-full rounded border border-beta/30 bg-light px-3 py-2 text-beta focus:border-alpha focus:ring-1 focus:ring-alpha focus:outline-none dark:border-light/20 dark:bg-dark_gray dark:text-light"
                                    >
                                        {MONTHS.map((month) => (
                                            <option key={month.value} value={month.value}>
                                                {month.label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={error?.endMonth} className="mt-1" />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-beta opacity-0 dark:text-light">Year</label>
                                    <select
                                        name="endYear"
                                        value={data.endYear}
                                        onChange={handleChange}
                                        className="w-full rounded border border-beta/30 bg-light px-3 py-2 text-beta focus:border-alpha focus:ring-1 focus:ring-alpha focus:outline-none dark:border-light/20 dark:bg-dark_gray dark:text-light"
                                    >
                                        {YEARS.map((year) => (
                                            <option key={year.value} value={year.value}>
                                                {year.label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={error?.endYear} className="mt-1" />
                                </div>
                            </div>
                        )}

                        {/* Date Validation Error */}
                        {dateError && (
                            <div className="flex items-center gap-2 rounded border border-error/30 bg-error/10 p-3">
                                <svg className="h-5 w-5 flex-shrink-0 text-error" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span className="text-sm font-medium text-error">{dateError}</span>
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-beta dark:text-light">Description</label>
                            <textarea
                                name="description"
                                value={data.description}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Describe your academic achievements, activities, honors, or relevant coursework."
                                className="w-full resize-none rounded border border-beta/30 bg-light px-3 py-2 text-beta placeholder:text-beta/50 focus:border-alpha focus:ring-1 focus:ring-alpha focus:outline-none dark:border-light/20 dark:bg-dark_gray dark:text-light dark:placeholder:text-light/50"
                            />
                            <InputError message={error?.description} className="mt-1" />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 flex justify-end gap-3 border-t border-beta/20 bg-light p-4 dark:border-light/10 dark:bg-dark">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="rounded-full border border-beta/30 px-6 py-2 font-medium text-beta transition-colors hover:bg-beta/5 dark:border-light/30 dark:text-light dark:hover:bg-light/5"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => createEducation()}
                            disabled={processing || dateError}
                            className="rounded-full bg-alpha px-6 py-2 font-medium text-black transition-colors hover:bg-alpha/90 disabled:cursor-not-allowed disabled:opacity-50 dark:text-black"
                        >
                            {processing ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
export default CreateEducationModal;
