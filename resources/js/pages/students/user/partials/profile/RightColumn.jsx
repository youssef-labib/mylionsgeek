import Education from './components/Education';
import Experience from './components/Experience';
import ProfilePostsPreview from './ProfilePostsPreview';

const RightColumn = ({ user, postsPreview = [], postsTotal = 0 }) => {
    return (
        <>
            <div className="space-y-4 lg:col-span-2">
                <ProfilePostsPreview user={user} postsPreview={postsPreview} postsTotal={postsTotal} />
                {/* Education Card */}
                <Education user={user} />
                <Experience user={user} />

                {/* Projects Card */}
                {/* <div className="bg-white dark:bg-dark_gray rounded-lg shadow p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-beta dark:text-light">Featured Projects</h2>
                        <button className="p-1 hover:bg-beta/5 dark:hover:bg-light/5 rounded">
                            <Plus className="w-4 h-4 text-beta/70 dark:text-light/70" />
                        </button>
                    </div>

                    <div className="space-y-4"> */}
                {/* Project 1 */}
                {/* <div className="border-2 border-beta/20 dark:border-light/20 rounded-lg p-3 hover:border-alpha dark:hover:border-alpha transition-colors">
                            <h3 className="font-semibold text-beta dark:text-light">E-Commerce Platform</h3>
                            <p className="text-sm text-beta/80 dark:text-light/80 mt-1">
                                Full-stack e-commerce solution with payment integration, cart management, and admin dashboard.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="px-2 py-1 bg-beta/10 dark:bg-light/10 text-beta dark:text-light rounded text-xs">React</span>
                                <span className="px-2 py-1 bg-beta/10 dark:bg-light/10 text-beta dark:text-light rounded text-xs">Node.js</span>
                                <span className="px-2 py-1 bg-beta/10 dark:bg-light/10 text-beta dark:text-light rounded text-xs">MongoDB</span>
                            </div>
                        </div> */}

                {/* Project 2 */}
                {/* <div className="border-2 border-beta/20 dark:border-light/20 rounded-lg p-3 hover:border-alpha dark:hover:border-alpha transition-colors">
                            <h3 className="font-semibold text-beta dark:text-light">Task Management App</h3>
                            <p className="text-sm text-beta/80 dark:text-light/80 mt-1">
                                Modern task management application with real-time updates and team collaboration features.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="px-2 py-1 bg-beta/10 dark:bg-light/10 text-beta dark:text-light rounded text-xs">React</span>
                                <span className="px-2 py-1 bg-beta/10 dark:bg-light/10 text-beta dark:text-light rounded text-xs">Firebase</span>
                                <span className="px-2 py-1 bg-beta/10 dark:bg-light/10 text-beta dark:text-light rounded text-xs">Tailwind</span>
                            </div>
                        </div> */}
                {/* </div> */}
                {/* </div> */}
            </div>
        </>
    );
};

export default RightColumn;
