<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Job extends Model
{
    /** Laravel reserves the `jobs` table for the database queue driver. */
    protected $table = 'job_postings';

    protected $fillable = [
        'reference',
        'title',
        'description',
        'location',
        'job_type',
        'skills',
        'is_published',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'skills' => 'array',
            'is_published' => 'boolean',
        ];
    }

    /** Admin user who created this posting (not assigned recruiters). */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function recruiters(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'job_posting_recruiter', 'job_posting_id', 'user_id')->withTimestamps();
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class, 'job_posting_id');
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public static function generateUniqueReference(): string
    {
        do {
            $reference = 'LG-JOB-'.now()->format('Y').'-'.Str::upper(Str::random(6));
        } while (static::query()->where('reference', $reference)->exists());

        return $reference;
    }
}
