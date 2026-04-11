import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Link } from '@inertiajs/react';
import { formatJobTypeLabel } from '@/pages/students/Jobs/partials/jobHelpers';

function toggleId(list, id) {
    const n = Number(id);
    const set = new Set((list ?? []).map(Number));
    if (set.has(n)) {
        set.delete(n);
    } else {
        set.add(n);
    }
    return [...set];
}

export default function JobPostingForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    jobTypeOptions = [],
    recruiterOptions = [],
    cancelHref,
    reference = null,
    submitLabel = 'Save posting',
}) {
    const skillsValue = Array.isArray(data.skills) ? data.skills.join(', ') : data.skills ?? '';

    return (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {reference && (
                <p className="font-mono text-sm text-muted-foreground">
                    Reference: <span className="text-foreground">{reference}</span>
                </p>
            )}

            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    className="border-alpha/30 dark:border-light/15"
                    required
                />
                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={8}
                    className="border-alpha/30 dark:border-light/15"
                    required
                />
                {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                        id="location"
                        value={data.location ?? ''}
                        onChange={(e) => setData('location', e.target.value)}
                        className="border-alpha/30 dark:border-light/15"
                    />
                    {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Job type</Label>
                    <Select value={data.job_type} onValueChange={(v) => setData('job_type', v)}>
                        <SelectTrigger className="border-alpha/30 dark:border-light/15">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {jobTypeOptions.map((t) => (
                                <SelectItem key={t} value={t}>
                                    {formatJobTypeLabel(t)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.job_type && <p className="text-sm text-red-600">{errors.job_type}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input
                    id="skills"
                    value={skillsValue}
                    onChange={(e) => setData('skills', e.target.value)}
                    placeholder="React, Laravel, SQL"
                    className="border-alpha/30 dark:border-light/15"
                />
                {errors.skills && <p className="text-sm text-red-600">{errors.skills}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="deadline">Application deadline</Label>
                <Input
                    id="deadline"
                    type="date"
                    value={data.deadline ?? ''}
                    onChange={(e) => setData('deadline', e.target.value)}
                    className="border-alpha/30 dark:border-light/15"
                />
                {errors.deadline && <p className="text-sm text-red-600">{errors.deadline}</p>}
            </div>

            <div className="space-y-3 rounded-lg border border-alpha/15 p-4 dark:border-light/10">
                <Label className="text-base">Assigned recruiters</Label>
                <p className="text-sm text-muted-foreground">They can view applications for this posting. Leave empty if none yet.</p>
                {recruiterOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recruiter accounts yet — add them under Admin → Recruiters.</p>
                ) : (
                    <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                        {recruiterOptions.map((r) => (
                            <label key={r.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-alpha/10 p-2 dark:border-light/10">
                                <Checkbox
                                    checked={Array.isArray(data.recruiter_ids) && data.recruiter_ids.map(Number).includes(Number(r.id))}
                                    onCheckedChange={() => setData('recruiter_ids', toggleId(data.recruiter_ids, r.id))}
                                />
                                <span className="text-sm leading-tight">
                                    <span className="font-medium text-beta dark:text-light">{r.name}</span>
                                    <span className="mt-0.5 block text-xs text-muted-foreground">{r.email}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                )}
                {errors.recruiter_ids && <p className="text-sm text-red-600">{errors.recruiter_ids}</p>}
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox
                    id="is_published"
                    checked={data.is_published}
                    onCheckedChange={(c) => setData('is_published', c === true)}
                />
                <Label htmlFor="is_published" className="text-sm font-normal">
                    Publish on the student job board
                </Label>
            </div>

            <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={processing} className="bg-alpha text-white hover:bg-alpha/90">
                    {processing ? 'Saving…' : submitLabel}
                </Button>
                <Button type="button" variant="outline" asChild>
                    <Link href={cancelHref}>Cancel</Link>
                </Button>
            </div>
        </form>
    );
}
