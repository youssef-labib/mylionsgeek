<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'deadline',
        'is_published',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'skills' => 'array',
            'deadline' => 'date',
            'is_published' => 'boolean',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeOpenDeadline($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('deadline')->orWhereDate('deadline', '>=', now()->toDateString());
        });
    }
}
