import AppLayout from '@/layouts/app-layout';
import Header from './profile/Header';
import LeftColumn from './profile/LeftColumn';
import RightColumn from './profile/RightColumn';

const StudentProfile = ({ user, profilePostsPreview = [], profilePostsTotal = 0 }) => {
    const currentUser = user.user;

    const userFunctionality = (user) => {
        if (user?.field == 'coding') {
            return 'Full Stack Developer';
        }
        return 'Content Creator';
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-light dark:bg-dark">
                <div className="max-w-full px-4 py-6">
                    {/* Profile Header Card */}
                    <Header user={currentUser} userFunctionality={userFunctionality} />

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {/* Left Column */}
                        <LeftColumn user={currentUser} />

                        {/* Right Column */}
                        <RightColumn
                            user={currentUser}
                            postsPreview={profilePostsPreview}
                            postsTotal={profilePostsTotal}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default StudentProfile;
