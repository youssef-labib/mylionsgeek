import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatJobTypeLabel } from './jobHelpers';

export default function JobsFilterSidebar({
    jobTypes,
    skillsOptions,
    jobType,
    selectedSkills,
    hasActiveFilters,
    onJobTypeChange,
    onToggleSkill,
    onClearFilters,
}) {
    return (
        <aside className="space-y-4 lg:col-span-3">
            <div className="rounded-lg border border-alpha/20 bg-white p-4 shadow-sm dark:border-light/10 dark:bg-dark_gray">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-beta dark:text-light">Filters</h2>
                    {hasActiveFilters && (
                        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={onClearFilters}>
                            Clear
                        </Button>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-xs text-beta/80 dark:text-light/80">Job type</Label>
                    <Select value={jobType ? jobType : '__all__'} onValueChange={onJobTypeChange}>
                        <SelectTrigger className="border-alpha/30 bg-white dark:border-light/15 dark:bg-dark">
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">All types</SelectItem>
                            {jobTypes.map((t) => (
                                <SelectItem key={t} value={t}>
                                    {formatJobTypeLabel(t)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="mt-4 space-y-2">
                    <Label className="text-xs text-beta/80 dark:text-light/80">Skills</Label>
                    {skillsOptions.length === 0 ? (
                        <p className="text-xs text-beta/60 dark:text-light/60">No skills in listings yet.</p>
                    ) : (
                        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                            {skillsOptions.map((skill) => (
                                <label
                                    key={skill}
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 hover:bg-beta/5 dark:hover:bg-light/5"
                                >
                                    <Checkbox
                                        checked={selectedSkills.includes(skill)}
                                        onCheckedChange={(c) => onToggleSkill(skill, c === true)}
                                    />
                                    <span className="text-sm text-beta dark:text-light">{skill}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
