<?php

namespace App\Modules\Synchronization\Controllers;

use App\Modules\Shared\Controllers\BaseApiController;
use App\Modules\Synchronization\Requests\ReceiveSyncRequest;
use App\Modules\Synchronization\Services\ReceiveSynchronizationService;
use Illuminate\Http\JsonResponse;

class SyncReceiveController extends BaseApiController
{
    public function __construct(
        private readonly ReceiveSynchronizationService $synchronization,
    ) {}

    public function __invoke(ReceiveSyncRequest $request): JsonResponse
    {
        $result = $this->synchronization->receive(
            $request->validated(),
            $request->bearerToken(),
        );

        return match ($result['status']) {
            'conflict' => response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'data' => $result['data'],
            ], 409),
            'invalid' => $this->errorResponse($result['message'], 422),
            default => $this->successResponse(
                $result['data'],
                $result['message'],
            ),
        };
    }
}
