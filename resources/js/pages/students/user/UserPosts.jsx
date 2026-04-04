import AppLayout from '@/layouts/app-layout';
import CenterFeed from './partials/feed/CenterFeed';
import LeftSideBar from './partials/feed/LeftSideBar';
import { Link, usePage } from '@inertiajs/react';

export default function UserPosts({ user, posts, postsTotal }) {
    const currentUser = user.user;
    const { auth } = usePage().props;
    const isOwnProfile = auth?.user?.id === currentUser.id;

    return (
        <AppLayout>
            <div className="z-30 dark:bg-dark">
                <div className="min-h-screen bg-transparent">
                    <div className="mx-auto max-w-7xl px-4">
                        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-4 justify-items-center">
                            {/* <LeftSideBar user={currentUser} /> */}
                            <CenterFeed
                                displayAddPost={false}
                                user={currentUser}
                                posts={posts}
                                showComposer={isOwnProfile}
                                lead={
                                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow shadow-alpha/10 dark:bg-dark_gray">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Link
                                                href={`/students/${currentUser.id}`}
                                                className="text-sm font-semibold text-alpha hover:underline"
                                            >
                                                ← Profile
                                            </Link>
                                            <h1 className="text-lg font-semibold text-beta dark:text-light">Posts</h1>
                                            {postsTotal > 0 && (
                                                <span className="text-sm text-beta/70 dark:text-light/70">
                                                    {postsTotal} {postsTotal === 1 ? 'post' : 'posts'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
