import { Avatar } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Link, router, usePage } from '@inertiajs/react';
import { Briefcase, Calendar, Camera, Edit2, ExternalLink, Github, Instagram, Linkedin, MapPin, MoreHorizontal, PenTool, User } from 'lucide-react';
import { useState } from 'react';
import FollowModal from '../../../../../components/FollowModal';
import ProfilePictureModal from '../../../../../components/ProfilePictureModal';
import Rolegard from '../../../../../components/rolegard';
import { helpers } from '../../../../../components/utils/helpers';
import EditUserModal from '../../../../admin/users/partials/EditModal';

const Header = ({ user, userFunctionality }) => {
    //console.log(user);

    const [openEdit, setOpenEdit] = useState(false);
    const [openFollowModal, setOpenFollowModal] = useState([]);
    const [openProfilePicture, setOpenProfilePicture] = useState(false);
    const { auth } = usePage().props;
    const { addOrRemoveFollow } = helpers();

    const handleProfilePictureClick = () => {
        // Only show modal for other users' profiles, not own profile
        if (auth.user?.id !== user?.id && user?.image) {
            setOpenProfilePicture(true);
        }
    };

    // Filter social links based on user formation and allowed platforms
    const allowedPlatforms = ['instagram', 'linkedin', 'portfolio', 'behance'];

    const filteredSocialLinks = (user?.social_links || []).filter((link) => allowedPlatforms.includes(link.title));

    const getSocialIcon = (platform) => {
        switch (platform) {
            case 'instagram':
                return Instagram;
            case 'linkedin':
                return Linkedin;
            case 'portfolio':
                return User;
            case 'behance':
                return PenTool;
            case 'github':
                return Github;
            default:
                return ExternalLink;
        }
    };

    const handleMessageClick = () => {
        // 7al chat w 3tiw conversation dyal had user
        window.dispatchEvent(
            new CustomEvent('open-chat', {
                detail: { userId: user?.id },
            }),
        );

        // 7al chat dialog
        const chatButton = document.querySelector('[aria-label="Chat"]');
        if (chatButton) {
            chatButton.click();
        }
    };

    const changeCover = (event, userId) => {
        const file = event.target.files[0]; // Get the first file
        if (!file) return; // If no file is selected, don't proceed

        const formData = new FormData();
        formData.append('cover', file); // Append the selected file to FormData

        // Send the POST request with the form data
        router.post(`/students/changeCover/${userId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // Make sure the request is sent as multipart
            },
            onSuccess: () => {
                //('Cover changed successfully');
            },
            onError: (error) => {
                //('Cover not changed', error);
            },
        });
    };

    const changeProfileImage = (event, userId) => {
        const file = event.target.files[0]; // Get the first file
        if (!file) return; // If no file is selected, don't proceed

        const formData = new FormData();
        formData.append('image', file); // Append the selected file to FormData

        // Send the POST request with the form data
        router.post(`/students/changeProfileImage/${userId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // Make sure the request is sent as multipart
            },
            onSuccess: () => {
                //('Cover changed successfully');
                //console.log('Image changed successfully');
            },
            onError: (error) => {
                //('Cover not changed', error);
                //console.log('Image change error: ' + error);
            },
        });
    };

    return (
        <>
            <div className="mb-4 overflow-hidden rounded-lg bg-white shadow dark:bg-dark_gray">
                {/* Cover Photo */}
                <div className="relative h-64 overflow-hidden md:h-80">
                    <img src={`/storage/${user?.cover}`} alt="Cover" className="h-full w-full object-cover" />
                    {/* Mesh gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    {/* Change Cover Icon */}
                    {auth.user.id == user.id && (
                        <label
                            className="absolute top-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-dark_gray"
                            aria-label="Change cover image"
                        >
                            <Camera size={24} className="cursor-pointer text-white" />
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 cursor-pointer opacity-0"
                                onChange={(e) => changeCover(e, user?.id)}
                            />
                        </label>
                    )}
                </div>

                {/* Social Links - Directly Under Cover */}
                {filteredSocialLinks.length > 0 && (
                    <div className="hidden justify-end px-6 pt-4 pb-2 lg:flex">
                        <div className="flex flex-wrap gap-2">
                            {filteredSocialLinks.map((link) => {
                                const Icon = getSocialIcon(link.title);
                                return (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-8 w-8 text-beta transition-colors hover:text-alpha dark:text-light dark:hover:text-alpha"
                                        title={link.title.charAt(0).toUpperCase() + link.title.slice(1)}
                                    >
                                        <Icon size={20} />
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Profile Info */}
                <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                    {/* Avatar */}
                    <div className="group relative mx-auto -mt-16 mb-5 w-fit lg:mx-0 lg:-mt-20">
                        <div className={`${auth.user?.id !== user?.id && user?.image ? 'cursor-pointer' : ''}`} onClick={handleProfilePictureClick}>
                            <Avatar
                                className="h-32 w-32 border-4 border-white sm:h-32 sm:w-32 lg:h-40 lg:w-40 dark:border-dark"
                                image={user?.image}
                                name={user?.name}
                                lastActivity={user?.online || null}
                                onlineCircleClass="hidden"
                                edit={auth.user?.id == user?.id}
                            />
                        </div>

                        {/* CAMERA ICON */}
                        {auth.user.id == user.id && (
                            <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-2 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 hover:bg-light dark:bg-dark_gray dark:hover:bg-beta">
                                <Camera className="h-5 w-5 text-beta dark:text-light" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 cursor-pointer opacity-0"
                                    onChange={(e) => changeProfileImage(e, user?.id)}
                                />
                            </button>
                        )}
                    </div>

                    {/* Name and Title - Facebook Style */}
                    <div className="text-center sm:text-left lg:hidden">
                        <h1 className="text-2xl font-bold text-beta sm:text-2xl lg:text-2xl dark:text-light">{user?.name}</h1>
                        <p className="mt-1 text-base text-beta/80 dark:text-light/80">{userFunctionality(user)}</p>

                        {/* Mobile Stats - Facebook Style */}
                        <div className="mt-4 flex justify-center gap-6 text-sm sm:justify-start">
                            <div className="cursor-pointer" onClick={() => setOpenFollowModal([true, 'followers'])}>
                                <span className="font-semibold text-beta dark:text-light">{user?.followers?.length}</span>
                                <span className="ml-1 text-beta/70 dark:text-light/70">Followers</span>
                            </div>
                            <div className="cursor-pointer" onClick={() => setOpenFollowModal([true, 'following'])}>
                                <span className="font-semibold text-beta dark:text-light">{user?.following?.length}</span>
                                <span className="ml-1 text-beta/70 dark:text-light/70">Following</span>
                            </div>
                        </div>

                        {/* Mobile Action Buttons - Facebook Style */}
                        <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row sm:justify-start">
                            {auth.user?.id == user?.id && (
                                <button
                                    onClick={() => setOpenEdit(true)}
                                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-alpha px-4 py-2 text-black transition-colors hover:bg-alpha/90 sm:w-auto"
                                >
                                    <Edit2 className="h-4 w-4" />
                                    <span className="text-sm font-medium">Edit Profile</span>
                                </button>
                            )}
                            {auth.user?.id != user?.id && (
                                <>
                                    <button
                                        onClick={() => addOrRemoveFollow(user?.id, user?.isFollowing)}
                                        className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 transition-colors sm:w-auto ${
                                            user?.isFollowing
                                                ? 'bg-dark text-black hover:bg-dark/90 dark:bg-alpha dark:text-black'
                                                : 'bg-alpha text-black hover:bg-alpha/90'
                                        }`}
                                    >
                                        <span className="text-sm font-medium">{user?.isFollowing ? 'Unfollow' : 'Follow'}</span>
                                    </button>
                                    {/* {user?.isFollowing && (
                                        <button
                                            onClick={handleMessageClick}
                                            className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            <span className="text-sm font-medium">Message</span>
                                        </button>
                                    )} */}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Desktop Layout - Original */}
                    <div className="hidden lg:block">
                        {/* Name and Title */}
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-beta dark:text-light">{user?.name}</h1>
                                <p className="mt-1 text-base text-beta/80 dark:text-light/80">{userFunctionality(user)}</p>

                                {/* Location and Details */}
                                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-beta/70 dark:text-light/70">
                                    {user?.adress && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            <span>{user?.adress}</span>
                                        </div>
                                    )}
                                    {user?.status && (
                                        <div className="flex items-center gap-1">
                                            <Briefcase className="h-4 w-4" />
                                            <span>{user?.status}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>{user?.created_at}</span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="mt-4 flex gap-4 text-sm">
                                    <div className="cursor-pointer" onClick={() => setOpenFollowModal([true, 'followers'])}>
                                        <span className="font-semibold text-beta dark:text-light">{user?.followers?.length}</span>
                                        <span className="ml-1 text-beta/70 dark:text-light/70">Followers</span>
                                    </div>
                                    <div className="cursor-pointer" onClick={() => setOpenFollowModal([true, 'following'])}>
                                        <span className="font-semibold text-beta dark:text-light">{user?.following?.length}</span>
                                        <span className="ml-1 text-beta/70 dark:text-light/70">Following</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-5">
                                {auth.user?.id == user?.id && (
                                    <button
                                        onClick={() => setOpenEdit(true)}
                                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-alpha px-4 py-2 text-black transition-colors hover:bg-alpha/90"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        <span className="text-sm font-medium">Edit Profile</span>
                                    </button>
                                )}
                                {auth.user?.id != user?.id && (
                                    <>
                                        <button
                                            onClick={() => addOrRemoveFollow(user?.id, user?.isFollowing)}
                                            className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                                                user?.isFollowing
                                                    ? 'bg-dark text-black hover:bg-dark/90 dark:bg-alpha dark:text-black'
                                                    : 'bg-alpha text-black hover:bg-alpha/90'
                                            }`}
                                        >
                                            <span className="text-sm font-medium">{user?.isFollowing ? 'Unfollow' : 'Follow'}</span>
                                        </button>
                                        {/* {user?.isFollowing && (
                                            <button
                                                onClick={handleMessageClick}
                                                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                <span className="text-sm font-medium">Message</span>
                                            </button>
                                        )} */}
                                    </>
                                )}

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <MoreHorizontal className="h-5 w-5 text-beta dark:text-light" />
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto rounded-lg border-none bg-light p-0 shadow-lg dark:bg-dark">
                                        <div className="flex flex-col items-start gap-5 p-4 text-foreground">
                                            {auth.user?.id == user?.id && (
                                                <Rolegard authorized={['admin', 'student']}>
                                                    <button onClick={() => setOpenEdit(true)} className="text-sm">
                                                        Edit Profile
                                                    </button>
                                                </Rolegard>
                                            )}
                                            <Rolegard authorized={['admin']}>
                                                <Link href={'/admin/users/' + user.id} className="text-sm">
                                                    View as Admin
                                                </Link>
                                            </Rolegard>
                                            <button className="text-sm text-error">Block User</button>
                                            <button className="text-sm text-red-500 hover:text-red-700">Report User</button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {openEdit && (
                <>
                    {/* //console.log('Header - user data passed to EditModal:', user)} */}
                    <EditUserModal
                        open={openEdit}
                        editedUser={user}
                        onClose={() => setOpenEdit(false)}
                        status={['studying', 'unemployed', 'internship', 'freelancing', 'working']}
                        roles={['student', 'admin', 'coach', 'studio_responsable']}
                        trainings={[]}
                    />
                </>
            )}
            {openFollowModal[0] && <FollowModal student={user} onOpenChange={setOpenFollowModal} openChange={openFollowModal} />}
            <ProfilePictureModal open={openProfilePicture} onOpenChange={setOpenProfilePicture} user={user} />
        </>
    );
};

export default Header;
