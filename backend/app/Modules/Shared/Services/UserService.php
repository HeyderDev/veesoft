<?php

namespace App\Modules\Shared\Services;

use App\Modules\Shared\Repositories\Contracts\UserRepositoryInterface;

class UserService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {}

    /**
     * @return array<int, array{id: int, name: string}>
     */
    public function getActiveForSelection(): array
    {
        return $this->userRepository
            ->activeForSelection()
            ->map(fn ($user): array => [
                'id' => $user->id,
                'name' => trim($user->first_name.' '.$user->last_name),
            ])
            ->values()
            ->all();
    }
}
