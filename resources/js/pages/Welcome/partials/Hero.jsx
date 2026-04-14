import { Link } from '@inertiajs/react';
import { CheckCircle } from 'lucide-react';
import HeroImg from '../../../../../public/assets/images/landing-page.svg';

const Hero = () => {
    return (
        <>
            <section id="home" className="relative scroll-mt-16 overflow-hidden">
                <div className="mx-auto grid min-h-[80vh] w-full items-center gap-12 px-4 py-20 md:max-w-7xl md:grid-cols-2">
                    <div className="relative z-10 space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-medium text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
                            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-alpha" />
                            Platform Management Made Simple
                        </div>
                        <h1 className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 bg-clip-text text-4xl leading-tight font-bold text-transparent sm:text-6xl dark:from-white dark:via-neutral-200 dark:to-neutral-400">
                            Manage Students & Staff Seamlessly
                        </h1>
                        <p className="max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
                            The all-in-one platform for LionsGeek's digital learning ecosystem. Schedule classes, track progress, manage resources,
                            and collaborate effortlessly.
                        </p>
                        <ul className="grid max-w-lg grid-cols-1 gap-3 text-sm text-neutral-600 sm:grid-cols-2 dark:text-neutral-400">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-alpha" />
                                Real-time scheduling
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-alpha" />
                                Attendance tracking
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-alpha" />
                                Performance analytics
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-alpha" />
                                Instant notifications
                            </li>
                        </ul>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link href={'/login'}>
                                <button className="inline-flex items-center rounded-lg border-2 border-transparent bg-alpha px-4 py-2 text-sm font-medium text-black transition-all hover:bg-[#2f343a] hover:text-black">
                                    Get Started
                                </button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-3 gap-6 border-t border-neutral-200 pt-8 dark:border-neutral-800">
                            <div>
                                <div className="text-3xl font-bold text-neutral-900 dark:text-white">2.5k+</div>
                                <div className="text-sm text-neutral-600 dark:text-neutral-400">Active Students</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-neutral-900 dark:text-white">150+</div>
                                <div className="text-sm text-neutral-600 dark:text-neutral-400">Staff Members</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-neutral-900 dark:text-white">98%</div>
                                <div className="text-sm text-neutral-600 dark:text-neutral-400">Satisfaction</div>
                            </div>
                        </div>
                    </div>
                    <div className="relative z-10 flex items-center justify-center">
                        <div className="relative w-full max-w-lg">
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-alpha/20 to-amber-600/20 blur-3xl"></div>
                            <img src={HeroImg} alt="Platform Dashboard" className="relative rounded-2xl shadow-2xl" />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Hero;
