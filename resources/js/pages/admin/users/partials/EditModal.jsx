import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInitials } from '@/hooks/use-initials';
import { router, usePage } from '@inertiajs/react';
import { Briefcase, ExternalLink, Facebook, Github, ImagePlus, Instagram, Linkedin, MessageCircle, Send, Trash, Twitter, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import Rolegard from '../../../../components/rolegard';
import RolesMultiSelect from './RolesMultiSelect';

const platformIcons = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    github: Github,
    linkedin: Linkedin,
    behance: ExternalLink,
    pinterest: ExternalLink,
    discord: MessageCircle,
    threads: Send,
    reddit: Users,
    portfolio: Briefcase,
};

const platforms = [
    { value: 'instagram', label: 'Instagram', domains: ['instagram.com', 'instagr.am'] },
    { value: 'github', label: 'GitHub', domains: ['github.com'] },
    { value: 'linkedin', label: 'LinkedIn', domains: ['linkedin.com'] },
    { value: 'behance', label: 'Behance', domains: ['behance.net'] },
    { value: 'portfolio', label: 'Portfolio', domains: [] }, // Portfolio doesn't require specific domains
];

const EditUserModal = ({ open, editedUser, onClose, roles = [], status = [], trainings = [] }) => {
    const getInitials = useInitials();
    const { auth } = usePage().props;
    const userRoles = Array.isArray(auth?.user?.role) ? auth.user.role : [auth?.user?.role];
    const isAdminOrStudioResponsable = userRoles.includes('admin') || userRoles.includes('moderateur') || userRoles.includes('studio_responsable');
    const [errors, setErrors] = useState({});
    const [newSocialPlatform, setNewSocialPlatform] = useState('');
    const [newSocialUrl, setNewSocialUrl] = useState('');
    const [socialValidationError, setSocialValidationError] = useState('');
    const [socialLinks, setSocialLinks] = useState(editedUser?.social_links || []);
    const canManageSocials = auth?.user?.id === editedUser?.id;

    // Filter out platforms that are already added
    const availablePlatforms = platforms.filter((platform) => !socialLinks.some((link) => link.title === platform.value));

    const [formData, setFormData] = useState({
        name: editedUser?.name || '',
        email: editedUser?.email || '',
        roles: [],
        status: editedUser?.status || '',
        formation_id: editedUser?.formation_id || '',
        phone: editedUser?.phone ?? '',
        cin: editedUser?.cin ?? '',
        image: editedUser?.image || null,
        access_studio: editedUser?.access_studio === 1 ? 'Yes' : 'No',
        access_cowork: editedUser?.access_cowork === 1 ? 'Yes' : 'No',
    });

    // Load user data into form when modal opens or user changes
    useEffect(() => {
        if (editedUser) {
            let rolesArray = [];
            if (Array.isArray(editedUser.role)) {
                rolesArray = editedUser.role;
            } else if (typeof editedUser.role === 'string' && editedUser.role.length > 0) {
                try {
                    const parsed = JSON.parse(editedUser.role);
                    if (Array.isArray(parsed)) rolesArray = parsed;
                    else
                        rolesArray = editedUser.role
                            .split(',')
                            .map((r) => r.trim())
                            .filter(Boolean);
                } catch {
                    rolesArray = editedUser.role
                        .split(',')
                        .map((r) => r.trim())
                        .filter(Boolean);
                }
            }
            rolesArray = rolesArray.map((r) => String(r).toLowerCase());
            setFormData({
                name: editedUser.name || '',
                email: editedUser.email || '',
                roles: rolesArray,
                status: editedUser.status || '',
                formation_id: editedUser.formation_id || '',
                phone: editedUser.phone ?? '',
                cin: editedUser.cin ?? '',
                image: editedUser?.image || null,
                access_studio: editedUser.access_studio === 1 ? 'Yes' : 'No',
                access_cowork: editedUser.access_cowork === 1 ? 'Yes' : 'No',
            });
            setSocialLinks(editedUser?.social_links || []);
        }
    }, [editedUser]);

    const validateSocialUrl = () => {
        if (!newSocialPlatform || !newSocialUrl) return false;

        const platform = platforms.find((p) => p.value === newSocialPlatform);
        if (!platform) return false;

        // Portfolio doesn't require domain validation
        if (platform.value === 'portfolio') {
            // Just check if it's a valid URL format
            try {
                new URL(newSocialUrl);
                setSocialValidationError('');
                return true;
            } catch {
                setSocialValidationError('Please enter a valid URL');
                return false;
            }
        }

        const urlLower = newSocialUrl.toLowerCase();
        const isValidDomain = platform.domains.some((domain) => urlLower.includes(domain));

        if (!isValidDomain) {
            setSocialValidationError(`URL must contain ${platform.domains.join(' or ')}`);
            return false;
        }

        setSocialValidationError('');
        return true;
    };

    const addSocialLink = () => {
        if (!validateSocialUrl()) return;

        router.post(
            '/studets/social-links',
            {
                title: newSocialPlatform,
                url: newSocialUrl,
            },
            {
                onSuccess: () => {
                    setNewSocialPlatform('');
                    setNewSocialUrl('');
                    setSocialValidationError('');
                },
                onError: (errors) => {
                    setSocialValidationError(errors.url || 'Failed to add social link');
                },
            },
        );
    };

    const deleteSocialLink = (linkId) => {
        router.delete(`/students/social-links/${linkId}`, {
            onSuccess: () => {
                // Social links will be updated via Inertia
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();

        if (!editedUser) return;

        const form = new FormData();

        form.append('_method', 'put');
        form.append('name', formData.name);
        form.append('email', formData.email);
        formData.roles.forEach((r) => form.append('roles[]', r));
        form.append('status', formData.status);
        form.append('phone', formData.phone);
        form.append('cin', formData.cin);
        form.append('formation_id', formData.formation_id || '');

        form.append('access_studio', formData.access_studio === 'Yes' ? 1 : 0);
        form.append('access_cowork', formData.access_cowork === 'Yes' ? 1 : 0);

        if (formData?.image instanceof File) {
            form.append('image', formData?.image);
        }

        router.post(`/students/update/${editedUser.id}`, form, {
            onSuccess: () => {
                setErrors({});
                onClose();
                //console.log('success');
            },
            onError: (err) => {
                setErrors(err);
                console.error('Form submission error:', err);
            },
        });
    };

    function resendLink(userId) {
        router.post(`/admin/users/${userId}/resend-link`);
    }

    const resetPassword = (id) => {
        router.post(`/admin/users/${id}/reset-password`, {
            onSuccess: () => {
                //alert('Password reset successfully');
            },
            onError: () => {
                //alert('Error resetting password');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-h-[80vh] overflow-y-auto bg-light text-dark sm:max-w-[720px] dark:bg-dark dark:text-light">
                <DialogHeader>
                    <DialogTitle>{editedUser ? getInitials(editedUser.name) : 'Modify user'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submitEdit} className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Avatar */}
                    <div className="col-span-1 mb-4 flex flex-col items-center gap-4 md:col-span-2">
                        <div className="relative h-24 w-24">
                            <Avatar
                                image={formData?.image instanceof File ? URL.createObjectURL(formData?.image) : formData?.image || editedUser?.image}
                                name={formData?.name}
                                lastActivity={editedUser?.last_online || null}
                                className="h-24 w-24 overflow-hidden rounded-full"
                                onlineCircleClass="hidden"
                            />

                            <label className="absolute right-0 bottom-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-alpha hover:bg-alpha/80">
                                <ImagePlus size={18} className="text-white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 cursor-pointer opacity-0"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setFormData({ ...formData, image: file });
                                    }}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Form Fields - Left Column */}
                    <div className="col-span-1">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    {/* Right Column - Email */}
                    <div className="col-span-1">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    {/* Left Column - Phone */}
                    <div className="col-span-1">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    {/* Right Column - CIN */}
                    {isAdminOrStudioResponsable && (
                        <div className="col-span-1">
                            <Label htmlFor="cin">CIN</Label>
                            <Input id="cin" value={formData.cin || ''} onChange={(e) => setFormData({ ...formData, cin: e.target.value })} />
                        </div>
                    )}
                    {/* Left Column - Status */}
                    <div className="col-span-1">
                        <Label>Status</Label>
                        <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {status?.map((s, idx) => (
                                    <SelectItem key={idx} value={s}>
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Socials Section */}
                    {canManageSocials && (
                        <div className="col-span-1 md:col-span-2">
                            <Label>Socials</Label>

                            <div className="mt-3">
                                <div className="flex w-full items-center gap-3">
                                    <div className="w-[40%]">
                                        <Select
                                            value={newSocialPlatform}
                                            onValueChange={(value) => {
                                                setNewSocialPlatform(value);
                                                setSocialValidationError('');
                                            }}
                                        >
                                            <SelectTrigger className="border-beta/30 focus:border-alpha focus:ring-alpha dark:border-light/20">
                                                <SelectValue placeholder="Select platform" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availablePlatforms.map((platform) => (
                                                    <SelectItem key={platform.value} value={platform.value}>
                                                        {platform.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-[40%]">
                                        <Input
                                            type="url"
                                            placeholder="https://example.com/username"
                                            value={newSocialUrl}
                                            onChange={(e) => {
                                                setNewSocialUrl(e.target.value);
                                                setSocialValidationError('');
                                            }}
                                            className="border-beta/30 focus:border-alpha focus:ring-alpha dark:border-light/20"
                                        />
                                    </div>
                                    <div className="w-[20%]">
                                        <button
                                            type="button"
                                            onClick={addSocialLink}
                                            disabled={!newSocialPlatform || !newSocialUrl}
                                            className="w-full rounded-full bg-alpha px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-alpha/90 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                                {socialValidationError && <p className="mt-1 text-xs text-red-500">{socialValidationError}</p>}
                            </div>

                            {/* Display existing social links */}
                            <div className="mt-4 space-y-2">
                                {socialLinks.length === 0 ? (
                                    <p className="text-sm text-beta/60 dark:text-light/60">No socials added.</p>
                                ) : (
                                    socialLinks.map((link) => {
                                        const IconComponent = platformIcons[link.title] || ExternalLink;
                                        return (
                                            <div
                                                key={link.id}
                                                className="flex items-center justify-between gap-3 rounded-lg border border-beta/10 p-3 transition hover:bg-beta/5 dark:border-light/10 dark:hover:bg-light/5"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-beta/5 dark:bg-light/5">
                                                        <IconComponent className="h-4 w-4 text-beta/70 dark:text-light/70" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-semibold text-beta dark:text-light">{link.title}</div>
                                                        <a
                                                            href={link.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="block truncate text-xs text-beta/60 hover:underline dark:text-light/60"
                                                        >
                                                            {link.url}
                                                        </a>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => deleteSocialLink(link.id)} className="text-error">
                                                    <Trash size={16} />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                    {/* Right Column - Roles */}
                    <Rolegard authorized={'admin'}>
                        {isAdminOrStudioResponsable && (
                            <div className="col-span-1">
                                <Label htmlFor="roles">Roles</Label>
                                <RolesMultiSelect roles={formData.roles} onChange={(newRoles) => setFormData({ ...formData, roles: newRoles })} />
                            </div>
                        )}
                    </Rolegard>
                    {/* Left Column - Access Studio */}
                    {isAdminOrStudioResponsable && (
                        <div className="col-span-1">
                            <Label htmlFor="access-studio">Access Studio</Label>
                            <Select
                                id="access-studio"
                                value={formData.access_studio}
                                onValueChange={(v) => setFormData({ ...formData, access_studio: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Access Studio" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={'Yes'}>Yes</SelectItem>
                                    <SelectItem value={'No'}>No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {/* Right Column - Access Cowork */}
                    {isAdminOrStudioResponsable && (
                        <div className="col-span-1">
                            <Label htmlFor="access-cowork">Access Cowork</Label>
                            <Select
                                id="access-cowork"
                                value={formData.access_cowork}
                                onValueChange={(v) => setFormData({ ...formData, access_cowork: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Access Cowork" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={'Yes'}>Yes</SelectItem>
                                    <SelectItem value={'No'}>No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {/* Left Column - Training */}
                    {isAdminOrStudioResponsable && (
                        <div className="col-span-1 md:col-span-2">
                            <Label>Training</Label>
                            <Select
                                value={formData.formation_id ? String(formData.formation_id) : ''}
                                onValueChange={(v) => setFormData({ ...formData, formation_id: Number(v) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select training" />
                                </SelectTrigger>
                                <SelectContent>
                                    {trainings.map((t) => (
                                        <SelectItem key={t.id} value={String(t.id)}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="col-span-1 mt-6 md:col-span-2">
                        <div className="flex flex-col items-center justify-between gap-4 border-t pt-4 md:flex-row">
                            {/* Left side - Resend Link */}
                            {editedUser?.activation_token != null ? (
                                <Button
                                    onClick={() => resendLink(editedUser.id)}
                                    type="button"
                                    className="flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-[#e5e5e5] px-2 py-1 text-[#0a0a0a] hover:bg-[#e5e5e5] hover:text-[#0a0a0a] dark:bg-[#262626] dark:text-white"
                                >
                                    Resend Link
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => resetPassword(editedUser.id)}
                                    type="button"
                                    className="flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-[#e5e5e5] px-2 py-1 text-[#0a0a0a] hover:bg-[#e5e5e5] hover:text-[#0a0a0a] dark:bg-[#262626] dark:text-white"
                                >
                                    Reset Password
                                </Button>
                            )}

                            {/* Right side - Action buttons */}
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    className="flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-[#e5e5e5] px-2 py-1 text-[#0a0a0a] hover:bg-[#e5e5e5] hover:text-[#0a0a0a] dark:bg-[#262626] dark:text-white"
                                    onClick={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">Save changes</Button>
                            </div>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditUserModal;
