import PostCard from '@/components/post/PostCard';
import { Link } from '@inertiajs/react';

export default function ProfilePostsPreview({ user, postsPreview, postsTotal }) {
    const hasPosts = postsTotal > 0;
    const postsHref = `/students/${user.id}/posts`;

    return (
        <div className="rounded-lg bg-white p-4 shadow dark:bg-dark_gray">
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-beta dark:text-light">Posts</h2>
            </div>

            {!hasPosts && <p className="text-sm text-beta/70 dark:text-light/70">No posts yet.</p>}

            {hasPosts && (
                <div className="space-y-4">
                    <PostCard user={user} posts={postsPreview} />
                    <div className="flex justify-center border-t border-beta/10 pt-4 dark:border-light/10">
                        <Link
                            href={postsHref}
                            className="text-sm font-semibold text-alpha hover:underline dark:text-alpha"
                        >
                            {postsTotal > 1 ? `See all posts (${postsTotal})` : 'See all posts'}
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
