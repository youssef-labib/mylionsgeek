<?php

namespace Database\Seeders;

use App\Models\Job;
use Illuminate\Database\Seeder;

class JobSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            [
                'reference' => 'LG-JOB-2026-0001',
                'title' => 'Junior Full Stack Developer',
                'description' => 'Join our product team to build internal tools and student-facing features using Laravel and React. You will pair with seniors, write tests, and ship iteratively.',
                'location' => 'Casablanca · Hybrid',
                'job_type' => 'full_time',
                'skills' => ['Laravel', 'React', 'TypeScript', 'MySQL'],
                'deadline' => now()->addMonths(2)->toDateString(),
            ],
            [
                'reference' => 'LG-JOB-2026-0002',
                'title' => 'Frontend internship — Design system',
                'description' => 'Six-month internship focused on Tailwind, accessibility, and component libraries. Ideal if you enjoy pixel-perfect UI and documentation.',
                'location' => 'Remote (Morocco)',
                'job_type' => 'internship',
                'skills' => ['React', 'Tailwind CSS', 'Figma'],
                'deadline' => now()->addWeeks(6)->toDateString(),
            ],
            [
                'reference' => 'LG-JOB-2026-0003',
                'title' => 'Backend engineer — APIs & integrations',
                'description' => 'Maintain REST APIs, webhooks, and third-party integrations. Experience with queues and structured logging is a plus.',
                'location' => 'Rabat',
                'job_type' => 'full_time',
                'skills' => ['PHP', 'Laravel', 'Redis', 'Docker'],
                'deadline' => now()->addMonths(3)->toDateString(),
            ],
            [
                'reference' => 'LG-JOB-2026-0004',
                'title' => 'Part-time teaching assistant (web)',
                'description' => 'Support cohorts during labs, review exercises, and help students debug HTML/CSS/JS fundamentals.',
                'location' => 'Casablanca · On-site',
                'job_type' => 'part_time',
                'skills' => ['JavaScript', 'HTML', 'CSS', 'Git'],
                'deadline' => now()->addMonth()->toDateString(),
            ],
            [
                'reference' => 'LG-JOB-2026-0005',
                'title' => 'Mobile internship — React Native',
                'description' => 'Build cross-platform features for a community app: navigation, offline cache, and push notifications.',
                'location' => 'Hybrid',
                'job_type' => 'internship',
                'skills' => ['React Native', 'TypeScript', 'REST APIs'],
                'deadline' => now()->addWeeks(10)->toDateString(),
            ],
            [
                'reference' => 'LG-JOB-2026-0006',
                'title' => 'DevOps / platform contract',
                'description' => 'Three-month contract to improve CI pipelines, staging environments, and observability for several Laravel services.',
                'location' => 'Remote',
                'job_type' => 'contract',
                'skills' => ['Docker', 'GitHub Actions', 'Linux', 'Nginx'],
                'deadline' => now()->addWeeks(8)->toDateString(),
            ],
            [
                'reference' => 'LG-JOB-2026-0007',
                'title' => 'UI engineer — marketing site',
                'description' => 'Ship landing pages, A/B tests, and performance improvements on our public site stack (Vite + React).',
                'location' => 'Casablanca',
                'job_type' => 'full_time',
                'skills' => ['React', 'Vite', 'Tailwind CSS', 'SEO basics'],
                'deadline' => null,
            ],
            [
                'reference' => 'LG-JOB-2026-0008',
                'title' => 'Data & automation intern',
                'description' => 'Assist with reporting pipelines, spreadsheet automation, and light SQL dashboards for operations.',
                'location' => 'Remote',
                'job_type' => 'internship',
                'skills' => ['SQL', 'Python', 'Excel'],
                'deadline' => now()->addWeeks(5)->toDateString(),
            ],
            [
                'reference' => 'LG-JOB-2026-0009',
                'title' => 'Full stack — realtime features',
                'description' => 'Work on chat and live notifications using Laravel, Inertia, and Ably or Pusher. Includes writing feature tests.',
                'location' => 'Hybrid · Casablanca',
                'job_type' => 'full_time',
                'skills' => ['Laravel', 'React', 'WebSockets', 'PHPUnit'],
                'deadline' => now()->addMonths(2)->toDateString(),
            ],
            [
                'reference' => 'LG-JOB-2026-0010',
                'title' => 'Content & video intern',
                'description' => 'Produce short tutorials and social clips about student projects. Collaborate with coaches on scripts and branding.',
                'location' => 'On-site',
                'job_type' => 'internship',
                'skills' => ['Premiere Pro', 'Storytelling', 'Social media'],
                'deadline' => now()->addWeeks(4)->toDateString(),
            ],
        ];

        foreach ($rows as $row) {
            Job::updateOrCreate(
                ['reference' => $row['reference']],
                array_merge($row, ['is_published' => true, 'user_id' => null])
            );
        }
    }
}
