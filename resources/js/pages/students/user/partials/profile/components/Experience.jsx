import { usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import CreateExperienceModal from '../../../../../../components/CreateExperienceModal';
import { ExperienceMenuModal } from '../../../../../../components/ExperienceMenuModal';
import { helpers } from '../../../../../../components/utils/helpers';

const Experience = ({ user }) => {
    const { auth } = usePage().props;
    const [openModal, setOpenModal] = useState();
    const [expandedExperience, setExpandedExperience] = useState([]);
    const { calculateDuration } = helpers();

    const getMonthName = (monthNumber) => {
        const date = new Date(2000, monthNumber - 1);
        return date.toLocaleString('en-US', { month: 'long' });
    };
    const experienceDurationFormat = (experience) => {
        //console.log(experience);

        if (!experience) return '';

        const start = `${getMonthName(experience.start_month)} ${experience.start_year}`;

        if (!experience.end_month || !experience.end_year) {
            return `${start} - Present`;
        }

        const end = `${getMonthName(experience.end_month)} ${experience.end_year}`;
        return `${start} - ${end}`;
    };
    return (
        <>
            <div className="rounded-lg bg-white p-4 shadow dark:bg-dark_gray">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-beta dark:text-light">Experience</h2>
                    {auth.user.id == user.id && (
                        <button onClick={() => setOpenModal(true)} className="rounded p-1 hover:bg-beta/5 dark:hover:bg-light/5">
                            <Plus className="h-4 w-4 text-beta/70 dark:text-light/70" />
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    {/* Experience Item 1 */}
                    {user.experiences.length == 0 ? (
                        <h2 className="w-full py-5 text-center text-beta dark:text-light">This user doesn't have any education</h2>
                    ) : (
                        user?.experiences?.map((experience, index) => (
                            <div key={index} className="flex w-full items-start justify-between">
                                <div className="flex gap-3">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-alpha font-bold text-black">
                                        {experience?.company?.slice(0, 1)}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="font-semibold text-beta dark:text-light">{experience?.title}</h2>
                                        <p className="text-[0.9rem] text-beta dark:text-light">
                                            {experience?.company} - {experience?.employement_type}
                                        </p>
                                        {/* <p className="text-sm text-beta/70 dark:text-light/70"></p> */}
                                        <p className="mt-1 text-xs text-beta/60 dark:text-light/60">
                                            {experienceDurationFormat(experience)} · {calculateDuration(experience)} - {experience?.location}
                                        </p>
                                        {(() => {
                                            const text = experience?.description || '';
                                            const limit = 250;
                                            const isLong = text.length > limit;
                                            const id = experience?.id ?? index;
                                            const isExpanded = expandedExperience.includes(id);
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
                                                                setExpandedExperience((prev) => {
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
                                {auth.user.id == user.id && <ExperienceMenuModal experience={experience} />}
                            </div>
                        ))
                    )}
                </div>
            </div>
            {openModal && <CreateExperienceModal id={user} onChange={openModal} onOpenChange={setOpenModal} />}
        </>
    );
};

export default Experience;
