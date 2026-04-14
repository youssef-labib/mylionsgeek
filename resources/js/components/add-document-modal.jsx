import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogPanel, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';

export function AddDocumentModal({ user, isOpen, onClose }) {
    const [docs, setDocs] = useState({ contracts: [], medicals: [] });
    const [uploadKind, setUploadKind] = useState('contract');
    const [uploadError, setUploadError] = useState('');
    const [selectedFileName, setSelectedFileName] = useState('');

    const loadDocs = async () => {
        try {
            const r = await fetch(`/admin/users/${user.id}/documents`, {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
            });
            if (r.ok) {
                const d = await r.json();
                setDocs({
                    contracts: Array.isArray(d?.contracts) ? d.contracts : [],
                    medicals: Array.isArray(d?.medicals) ? d.medicals : [],
                });
            }
        } catch (error) {
            console.error('Failed to load documents:', error);
        }
    };

    useEffect(() => {
        if (isOpen) loadDocs();
    }, [isOpen]);

    // Prevent ESC key from closing the modal
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        };

        document.addEventListener('keydown', handleEscape, true);
        return () => {
            document.removeEventListener('keydown', handleEscape, true);
        };
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploadError('');

        const form = e.currentTarget;
        const kind = form.docKind.value;
        const name = form.docName.value.trim();
        const type = form.docType?.value?.trim() || '';
        const file = form.docFile.files?.[0];

        if (!file) return;

        const body = new FormData();
        body.append('kind', kind);
        body.append('file', file);
        if (name) body.append('name', name);
        if (kind === 'contract' && type) body.append('type', type);

        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        body.append('_token', csrf);

        const res = await fetch(`/admin/users/${user.id}/documents`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrf,
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
            body,
        });

        if (!res.ok) {
            try {
                const data = await res.json();
                setUploadError(data?.message || 'Upload failed');
            } catch {
                setUploadError('Upload failed');
            }
            return;
        }

        await loadDocs();
        form.reset();
        setSelectedFileName('');
        setUploadKind('contract');
        setUploadError('');
        // Close modal on successful submission
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-50"
                onClose={() => {
                    // Do nothing - prevent automatic closing
                }}
            >
                {/* Backdrop - no click handler */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                {/* Modal Panel */}
                <div className="pointer-events-none fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <DialogPanel
                            className="pointer-events-auto max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="mb-4 flex items-center justify-between">
                                <Dialog.Title className="text-xl font-bold">Add Document</Dialog.Title>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        onClose();
                                    }}
                                    className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                                    aria-label="Close"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Upload Form */}
                            <form className="space-y-4" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                                <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-5">
                                    {/* Kind */}
                                    <div>
                                        <Label>Document Type</Label>
                                        <select
                                            name="docKind"
                                            value={uploadKind}
                                            onChange={(e) => setUploadKind(e.target.value)}
                                            className="w-full rounded-lg border bg-white px-3 py-2.5 dark:bg-neutral-800"
                                        >
                                            <option value="contract">Contract</option>
                                            <option value="medical">Medical</option>
                                        </select>
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <Label>{uploadKind === 'contract' ? 'Document Name' : 'Description'}</Label>
                                        <input
                                            name="docName"
                                            type="text"
                                            className="w-full rounded-lg border bg-white px-3 py-2.5 dark:bg-neutral-800"
                                            placeholder="Enter name"
                                            autoComplete="off"
                                        />
                                    </div>

                                    {/* Contract type */}
                                    {uploadKind === 'contract' && (
                                        <div>
                                            <Label>Contract Type</Label>
                                            <input
                                                name="docType"
                                                type="text"
                                                placeholder="e.g., Full-time"
                                                className="w-full rounded-lg border bg-white px-3 py-2.5 dark:bg-neutral-800"
                                                autoComplete="off"
                                            />
                                        </div>
                                    )}

                                    {/* File Upload */}
                                    <div>
                                        <Label>Select File</Label>
                                        <label
                                            htmlFor="docFile"
                                            className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700"
                                        >
                                            {selectedFileName || 'Choose file'}
                                        </label>
                                        <input
                                            id="docFile"
                                            type="file"
                                            name="docFile"
                                            className="hidden"
                                            accept="application/pdf,image/*"
                                            required
                                            onChange={(e) => setSelectedFileName(e.target.files[0]?.name || '')}
                                        />
                                    </div>

                                    {/* Submit */}
                                    <div>
                                        <Button
                                            type="submit"
                                            className="w-full cursor-pointer border border-[var(--color-alpha)] bg-[var(--color-alpha)] text-black hover:bg-transparent hover:text-[var(--color-alpha)]"
                                        >
                                            Upload
                                        </Button>
                                    </div>
                                </div>

                                {uploadError && <div className="text-sm text-red-600">{uploadError}</div>}
                            </form>

                            {/* Documents list */}
                            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2" onClick={(e) => e.stopPropagation()}>
                                <DocumentList title="Contracts" count={docs.contracts.length} items={docs.contracts} user={user} type="contract" />

                                <DocumentList
                                    title="Medical Certificates"
                                    count={docs.medicals.length}
                                    items={docs.medicals}
                                    user={user}
                                    type="medical"
                                />
                            </div>
                        </DialogPanel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}

/* -------------------------- DOCUMENT LIST COMPONENT ------------------------- */
function DocumentList({ title, count, items, user, type }) {
    return (
        <div className="rounded-xl border bg-gradient-to-br from-alpha/5 to-alpha/10 p-4">
            <div className="mb-4 flex items-center justify-between">
                <div className="font-bold">{title}</div>
                <div className="rounded-full bg-alpha px-2 py-1 text-xs text-black">{count}</div>
            </div>

            {items.length > 0 ? (
                <ul className="space-y-2">
                    {items.map((d, i) => (
                        <li key={i} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 dark:bg-neutral-800">
                            <span className="truncate">{d.name}</span>
                            <a
                                href={`/admin/users/${user.id}/documents/${type}/${d.id}`}
                                className="text-xs font-semibold text-alpha"
                                target="_blank"
                            >
                                View
                            </a>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="py-4 text-center text-sm text-neutral-500">No {title.toLowerCase()}</p>
            )}
        </div>
    );
}
