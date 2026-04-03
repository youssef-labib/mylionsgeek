<?php

namespace App\Support;

use App\Models\User;

class PostMentionResolver
{
    /**
     * Map each @mention token (without "@", lowercased) to a user id.
     * Matches notification extraction: name with spaces removed, case-insensitive.
     *
     * @return array<string, int> e.g. ['johndoe' => 12]
     */
    public static function mapTokensToUserIds(?string $description): array
    {
        if (! $description) {
            return [];
        }

        preg_match_all('/@([A-Za-z0-9_]+)/u', $description, $matches);

        if (empty($matches[1])) {
            return [];
        }

        $tokens = array_unique(array_map('strtolower', $matches[1]));
        $map = [];

        foreach ($tokens as $token) {
            $user = User::query()
                ->whereNotNull('name')
                ->whereRaw(
                    'LOWER(REPLACE(name, " ", "")) = ?',
                    [$token]
                )
                ->first(['id']);

            if ($user) {
                $map[$token] = (int) $user->id;
            }
        }

        return $map;
    }
}
