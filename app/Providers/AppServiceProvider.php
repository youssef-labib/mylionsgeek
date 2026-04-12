<?php

namespace App\Providers;

use App\Models\Reservation;
use App\Models\ReservationCowork;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Inertia::share([
            'reservationStats' => function () {
                return [
                    'reservation' => [
                        'notProcessed' => Reservation::where('approved', 0)
                            ->where('canceled', 0)
                            ->where('passed', 0)
                            ->count(),
                    ],
                    'cowork' => [
                        'notProcessed' => ReservationCowork::where('approved', 0)
                            ->where('canceled', 0)
                            ->where('passed', 0)
                            ->count(),
                    ],
                ];
            },
        ]);
    }
}
