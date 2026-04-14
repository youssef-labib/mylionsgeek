// resources/js/Pages/Profile/Complete.jsx

import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
// import { input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera, Eye, EyeOff } from 'lucide-react';

const CompleteProfile = ({ user }) => {
    const { data, setData, post, processing, errors, setError } = useForm({
        password: '',
        password_confirmation: '',
        phone: '',
        cin: '',
        entreprise: '',
        status: '',
        image: null,
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('image', file);
            setValidationErrors({ ...validationErrors, image: '' });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!data.phone || data.phone.trim() === '') {
            newErrors.phone = 'Phone number is required';
        }

        if (!data.cin || data.cin.trim() === '') {
            newErrors.cin = 'CIN is required';
        }

        if (!data.entreprise || data.entreprise.trim() === '') {
            newErrors.entreprise = 'Entreprise is required';
        }

        if (!data.password || data.password.trim() === '') {
            newErrors.password = 'Password is required';
        } else {
            const passwordRegex = /^(?=.*[A-Z]).{8,}$/;
            if (!passwordRegex.test(data.password)) {
                newErrors.password = 'Password must be at least 8 characters long and include at least one uppercase letter';
            }
        }

        if (!data.password_confirmation || data.password_confirmation.trim() === '') {
            newErrors.password_confirmation = 'Password confirmation is required';
        } else if (data.password !== data.password_confirmation) {
            newErrors.password_confirmation = 'Passwords do not match';
        }

        if (!data.image) {
            newErrors.image = 'Profile image is required';
        }

        setValidationErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (userToken) => {
        // Clear previous manual errors
        setError('password', null);
        setError('password_confirmation', null);

        // Validate form
        if (!validateForm()) {
            return;
        }

        // Continue with form submission if valid
        router.post(`/complete-profile/update/${userToken}`, data, {
            onSuccess: () => {
                window.location.href = '/login';
            },
            onError: (errors) => {
                console.error('Validation Errors:', errors);
            },
            onFinish: () => {
                //('Request finished');
            },
        });
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-white p-4">
            <div className="w-full max-w-3xl">
                {/* Main Card */}
                <div className="rounded-3xl bg-white p-8 shadow-2xl">
                    <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">Complete Your Profile</h2>

                    <form onSubmit={(e) => e.preventDefault()}>
                        {/* Profile Image Upload */}
                        <div className="mb-6 flex flex-col items-center">
                            <div className="relative">
                                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <Camera className="h-10 w-10 text-gray-400" />
                                    )}
                                </div>
                            </div>
                            <label htmlFor="image-upload" className="mt-3 cursor-pointer">
                                <div className="rounded-lg bg-gray-800 px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-700">
                                    Upload Image
                                </div>
                                <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                            {(validationErrors.image || errors.image) && (
                                <span className="mt-2 text-sm text-red-500">{validationErrors.image || errors.image}</span>
                            )}
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            {/* Row 1: Phone & CIN */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-600">
                                        Phone Number
                                    </Label>
                                    <input
                                        id="phone"
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="+212 600 000 000"
                                        className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black focus:border-green-500 focus:outline-none"
                                    />
                                    {(validationErrors.phone || errors.phone) && (
                                        <span className="mt-1 block text-sm text-red-500">{validationErrors.phone || errors.phone}</span>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <Label htmlFor="cin" className="mb-2 block text-sm font-medium text-gray-600">
                                        CIN
                                    </Label>
                                    <input
                                        id="cin"
                                        type="text"
                                        value={data.cin}
                                        onChange={(e) => setData('cin', e.target.value)}
                                        placeholder="Enter your CIN"
                                        className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black focus:border-green-500 focus:outline-none"
                                    />
                                    {(validationErrors.cin || errors.cin) && (
                                        <span className="mt-1 block text-sm text-red-500">{validationErrors.cin || errors.cin}</span>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: Entreprise */}
                            <div>
                                <Label htmlFor="entreprise" className="mb-2 block text-sm font-medium text-gray-600">
                                    Entreprise
                                </Label>
                                <input
                                    id="entreprise"
                                    type="text"
                                    value={data.entreprise}
                                    onChange={(e) => setData('entreprise', e.target.value)}
                                    placeholder="Enter your company name"
                                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black focus:border-green-500 focus:outline-none"
                                />
                                {(validationErrors.entreprise || errors.entreprise) && (
                                    <span className="mt-1 block text-sm text-red-500">{validationErrors.entreprise || errors.entreprise}</span>
                                )}
                            </div>

                            {/* Row 3: Password & Confirm Password */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-600">
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Enter your password"
                                            className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black focus:border-green-500 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    {(validationErrors.password || errors.password) && (
                                        <span className="mt-1 block text-sm text-red-500">{validationErrors.password || errors.password}</span>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <Label htmlFor="password_confirmation" className="mb-2 block text-sm font-medium text-gray-600">
                                        Confirm Password
                                    </Label>
                                    <div className="relative">
                                        <input
                                            id="password_confirmation"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            placeholder="Confirm your password"
                                            className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black focus:border-green-500 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-500 hover:text-gray-700"
                                        >
                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    {(validationErrors.password_confirmation || errors.password_confirmation) && (
                                        <span className="mt-1 block text-sm text-red-500">
                                            {validationErrors.password_confirmation || errors.password_confirmation}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-6">
                            <Button
                                type="button"
                                onClick={() => handleSubmit(user.activation_token)}
                                disabled={processing}
                                className="w-full rounded-lg bg-alpha px-6 py-2.5 font-semibold text-black hover:bg-alpha hover:text-black"
                            >
                                {processing ? 'Submitting...' : 'Next'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default CompleteProfile;
