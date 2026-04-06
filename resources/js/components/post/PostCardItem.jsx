import PostCardFooter from './PostCardFooter';
import PostCardHeader from './PostCardHeader';
import PostCardMainContent from './PostCardMainContent';

const PostCardItem = ({
    post,
    authUser,
    user,
    isDeleting,
    takeToUserProfile,
    timeAgo,
    onDeletePost,
    addOrRemoveFollow,
    openModalPostId,
    onConsumedHashModal,
    openModalForComments,
    onConsumedCommentOpen,
    onCommentPress,
}) => {
    return (
        <div className="relative mb-4 overflow-hidden rounded-lg bg-white shadow dark:bg-dark_gray">
            {isDeleting && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-sm font-semibold text-dark dark:bg-dark/70 dark:text-light">
                    Deleting...
                </div>
            )}
            <PostCardHeader
                post={post}
                user={authUser}
                takeUserProfile={takeToUserProfile}
                timeAgo={timeAgo}
                onDeletePost={onDeletePost}
                isDeleting={isDeleting}
            />

            <PostCardMainContent
                post={post}
                user={user}
                addOrRemoveFollow={addOrRemoveFollow}
                timeAgo={timeAgo}
                takeToUserProfile={takeToUserProfile}
                openModalPostId={openModalPostId}
                onConsumedHashModal={onConsumedHashModal}
                openModalForComments={openModalForComments}
                onConsumedCommentOpen={onConsumedCommentOpen}
            />

            <PostCardFooter post={post} user={user} takeToUserProfile={takeToUserProfile} onCommentPress={onCommentPress} />
        </div>
    );
};

export default PostCardItem;
