import { Link } from '@inertiajs/react';
import { Menu, Moon, Sun, X } from 'lucide-react';

const Navbar = ({ scrollToSection, setDarkMode, darkMode, mobileMenuOpen, setMobileMenuOpen }) => {
    return (
        <>
            <div className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-lg dark:border-neutral-800 dark:bg-neutral-900/95">
                <div className="mx-auto flex h-16 w-full items-center justify-between px-4 md:max-w-7xl">
                    <div className="flex items-center gap-2">
                        <svg class="fill-[#0f0f0f] dark:fill-[#fff]" xmlns="http://www.w3.org/2000/svg" width="206.551" height="35.121">
                            <g data-name="Groupe 19">
                                <g data-name="Groupe 4">
                                    <path
                                        data-name="Tracé 12"
                                        d="M29.876 0H7.053L0 21.706l18.464 13.415 18.468-13.415zM18.465 27.506L7.243 19.353l4.286-13.192H25.4l4.286 13.192z"
                                    ></path>
                                    <path data-name="Tracé 13" d="M13.177 19.326l5.288 3.841 5.288-3.841z"></path>
                                </g>
                                <g data-name="Groupe 5">
                                    <path
                                        data-name="Tracé 1"
                                        d="M54 26.089V8.273h2.231v17.544l9.656-.272v1.9l-10.227.272A1.485 1.485 0 0154 26.089z"
                                    ></path>
                                    <path data-name="Tracé 2" d="M75.024 10.177V25.55h4.271v1.9h-10.8v-1.9h4.3V10.181h-4.3v-1.9h10.8v1.9z"></path>
                                    <path
                                        data-name="Tracé 3"
                                        d="M89.575 8c5.6 0 8.922 4.271 8.922 9.847 0 5.6-3.318 9.874-8.922 9.874-5.658 0-8.976-4.271-8.976-9.874 0-5.576 3.319-9.847 8.976-9.847zm0 17.817c4.516 0 6.692-3.373 6.692-7.97 0-4.57-2.176-7.942-6.692-7.942-4.542 0-6.746 3.373-6.746 7.942.001 4.597 2.204 7.97 6.746 7.97z"
                                    ></path>
                                    <path
                                        data-name="Tracé 4"
                                        d="M101.677 8.273h4.488l9.575 18.55h.626l-.354-1.6V8.277h2.2V27.45h-4.488l-9.548-18.551h-.625l.354 1.6V27.45h-2.231z"
                                    ></path>
                                    <path
                                        data-name="Tracé 5"
                                        d="M130.02 27.721c-6.692 0-8.677-2.965-8.677-7.453h2.23c0 4.543 2.421 5.549 6.447 5.549 3.264 0 5.141-.788 5.141-3.1 0-2.91-3.373-3.509-6.419-4.406-3.781-1.142-6.528-2.176-6.528-5.576 0-2.938 2.067-4.734 6.8-4.734 5.658 0 7.589 3.455 7.589 6.583h-2.23c0-3.264-2.421-4.678-5.359-4.678-2.638 0-4.57.653-4.57 2.774 0 2.013 1.687 2.748 4.842 3.727 3.754 1.169 8.106 2.2 8.106 6.2-.003 2.857-1.716 5.114-7.372 5.114z"
                                    ></path>
                                    <path
                                        data-name="Tracé 6"
                                        d="M148.539 8c4.814 0 7.48 2.938 8.051 7.127h-2.23c-.435-3.155-2.04-5.222-5.821-5.222-4.488 0-6.828 3.264-6.828 7.942 0 4.706 1.714 7.97 6.2 7.97 3.781 0 5.576-2.2 5.495-6.8h-6.554v-1.8h9.466c1.115 0 1.632.49 1.632 1.5v8.731h-2.231v-7.154l.353-2.448h-.625c-.027 6.691-2.611 9.874-7.562 9.874-5.631 0-8.405-4.216-8.405-9.874.001-5.63 3.51-9.846 9.059-9.846z"
                                    ></path>
                                    <path data-name="Tracé 7" d="M161.076 8.273h11.886v1.9h-9.656v6.719h8.3v1.9h-8.3v6.746h9.656v1.9h-11.886z"></path>
                                    <path data-name="Tracé 8" d="M176.143 8.273h11.887v1.9h-9.656v6.719h8.3v1.9h-8.3v6.746h9.656v1.9h-11.887z"></path>
                                    <path
                                        data-name="Tracé 9"
                                        d="M194.855 17.85l11.7 9.6h-3.209l-9.9-8.16v8.16h-2.231V8.274h2.231v8.16l9.9-8.16h3.209z"
                                    ></path>
                                </g>
                            </g>
                        </svg>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden items-center gap-6 md:flex">
                        <button
                            onClick={() => scrollToSection('home')}
                            className="text-sm font-medium text-neutral-600 transition-colors hover:text-alpha dark:text-neutral-400 dark:hover:text-alpha"
                        >
                            Home
                        </button>
                        <button
                            onClick={() => scrollToSection('features')}
                            className="text-sm font-medium text-neutral-600 transition-colors hover:text-alpha dark:text-neutral-400 dark:hover:text-alpha"
                        >
                            Features
                        </button>
                        <button
                            onClick={() => scrollToSection('how-it-works')}
                            className="text-sm font-medium text-neutral-600 transition-colors hover:text-alpha dark:text-neutral-400 dark:hover:text-alpha"
                        >
                            How it works
                        </button>
                        <button
                            onClick={() => scrollToSection('benefits')}
                            className="text-sm font-medium text-neutral-600 transition-colors hover:text-alpha dark:text-neutral-400 dark:hover:text-alpha"
                        >
                            Benefits
                        </button>
                        <button
                            onClick={() => scrollToSection('impact')}
                            className="text-sm font-medium text-neutral-600 transition-colors hover:text-alpha dark:text-neutral-400 dark:hover:text-alpha"
                        >
                            Impact
                        </button>
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="rounded-lg border border-neutral-200 p-2 transition-colors hover:border-alpha dark:border-neutral-700 dark:hover:border-alpha"
                            aria-label="Toggle dark mode"
                        >
                            {darkMode ? <Sun className="h-4 w-4 text-alpha" /> : <Moon className="h-4 w-4 text-neutral-600" />}
                        </button>
                        <Link href={'/login'}>
                            <button className="inline-flex items-center rounded-lg border-2 border-transparent bg-alpha px-4 py-2 text-sm font-medium text-black transition-all hover:bg-[#2f343a] hover:text-black">
                                Log in
                            </button>
                        </Link>
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-2 md:hidden">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="rounded-lg border border-neutral-200 p-2 transition-colors hover:border-alpha dark:border-neutral-700 dark:hover:border-alpha"
                            aria-label="Toggle dark mode"
                        >
                            {darkMode ? <Sun className="h-4 w-4 text-alpha" /> : <Moon className="h-4 w-4 text-neutral-600" />}
                        </button>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="rounded-lg border border-neutral-200 p-2 transition-colors hover:border-alpha dark:border-neutral-700 dark:hover:border-alpha"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {mobileMenuOpen && (
                    <div className="border-t border-neutral-200 bg-white md:hidden dark:border-neutral-800 dark:bg-neutral-900">
                        <nav className="flex flex-col space-y-2 p-4">
                            <button
                                onClick={() => scrollToSection('home')}
                                className="rounded-lg px-4 py-3 text-left text-sm font-medium text-neutral-600 transition-colors hover:bg-amber-50 hover:text-alpha dark:text-neutral-400 dark:hover:bg-amber-950/20"
                            >
                                Home
                            </button>
                            <button
                                onClick={() => scrollToSection('features')}
                                className="rounded-lg px-4 py-3 text-left text-sm font-medium text-neutral-600 transition-colors hover:bg-amber-50 hover:text-alpha dark:text-neutral-400 dark:hover:bg-amber-950/20"
                            >
                                Features
                            </button>
                            <button
                                onClick={() => scrollToSection('how-it-works')}
                                className="rounded-lg px-4 py-3 text-left text-sm font-medium text-neutral-600 transition-colors hover:bg-amber-50 hover:text-alpha dark:text-neutral-400 dark:hover:bg-amber-950/20"
                            >
                                How it works
                            </button>
                            <button
                                onClick={() => scrollToSection('benefits')}
                                className="rounded-lg px-4 py-3 text-left text-sm font-medium text-neutral-600 transition-colors hover:bg-amber-50 hover:text-alpha dark:text-neutral-400 dark:hover:bg-amber-950/20"
                            >
                                Benefits
                            </button>
                            <button
                                onClick={() => scrollToSection('impact')}
                                className="rounded-lg px-4 py-3 text-left text-sm font-medium text-neutral-600 transition-colors hover:bg-amber-50 hover:text-alpha dark:text-neutral-400 dark:hover:bg-amber-950/20"
                            >
                                Impact
                            </button>
                            <Link
                                href={'/login'}
                                className="mt-2 inline-flex w-full items-center justify-center rounded-lg border-2 border-transparent bg-alpha px-4 py-3 text-sm font-medium text-black transition-all hover:border-alpha hover:bg-black hover:text-alpha"
                            >
                                Log in
                            </Link>
                        </nav>
                    </div>
                )}
            </div>
        </>
    );
};

export default Navbar;
