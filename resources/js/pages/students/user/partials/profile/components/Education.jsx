import { usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import CreateEducationModal from '../../../../../../components/CreateEducationModal';
import { EducationMenuModal } from '../../../../../../components/EducationMenuModal';
import { helpers } from '../../../../../../components/utils/helpers';

const Education = ({ user }) => {
    //console.log(user);

    const { auth } = usePage().props;
    const [openModal, setOpenModal] = useState(false);
    const [expandedEducation, setExpandedEducation] = useState([]);
    const { calculateDuration } = helpers();

    const getMonthName = (monthNumber) => {
        const date = new Date(2000, monthNumber - 1);
        return date.toLocaleString('en-US', { month: 'long' });
    };
    const educationDurationFormat = (education) => {
        if (!education) return '';

        const start = `${getMonthName(education.start_month)} ${education.start_year}`;

        if (!education.end_month || !education.end_year) {
            return `${start} - Present`;
        }

        const end = `${getMonthName(education.end_month)} ${education.end_year}`;
        return `${start} - ${end}`;
    };
    return (
        <>
            <div className="rounded-lg bg-white p-4 shadow dark:bg-dark_gray">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-beta dark:text-light">Education</h2>
                    {auth.user.id == user.id && (
                        <button onClick={() => setOpenModal(true)} className="rounded p-1 hover:bg-beta/5 dark:hover:bg-light/5">
                            <Plus className="h-4 w-4 text-beta/70 dark:text-light/70" />
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    {/* Education Items */}
                    {user.educations.length == 0 ? (
                        <h2 className="w-full py-5 text-center text-beta dark:text-light">This user doesn't have any education</h2>
                    ) : (
                        user?.educations?.map((education, index) => (
                            <div key={index} className="flex w-full items-start justify-between">
                                <div className="flex gap-3">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-alpha font-bold text-black">
                                        {education?.school?.slice(0, 1)}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="font-semibold text-beta dark:text-light">{education?.school}</h2>
                                        <p className="text-[0.9rem] text-beta dark:text-light">
                                            {education?.degree}
                                            {education?.field_of_study && ` - ${education?.field_of_study}`}
                                        </p>
                                        <p className="mt-1 text-xs text-beta/60 dark:text-light/60">
                                            {educationDurationFormat(education)} · {calculateDuration(education)}
                                        </p>
                                        {(() => {
                                            const text = education?.description || '';
                                            const limit = 250;
                                            const isLong = text.length > limit;
                                            const id = education?.id ?? index;
                                            const isExpanded = expandedEducation.includes(id);
                                            const displayText = isLong && !isExpanded ? `${text.slice(0, limit)}...` : text;

                                            if (!text) return null;

                                            return (
                                                <div className="mt-2">
                                                    <p className="text-sm text-beta/80 dark:text-light/80">{displayText}</p>
                                                    {isLong && (
                                                        <button
                                                            type="button"
                                                            className="mt-1 text-xs font-semibold text-alpha hover:underline"
                                                            onClick={() => {
                                                                setExpandedEducation((prev) => {
                                                                    const has = prev.includes(id);
                                                                    if (has) return prev.filter((x) => x !== id);
                                                                    return [...prev, id];
                                                                });
                                                            }}
                                                        >
                                                            {isExpanded ? 'See less' : 'See more'}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                                {auth.user.id == user.id && <EducationMenuModal education={education} />}
                            </div>
                        ))
                    )}
                </div>
            </div>
            {openModal && <CreateEducationModal onOpen={openModal} onOpenChange={setOpenModal} />}
        </>
    );
};

export default Education;
