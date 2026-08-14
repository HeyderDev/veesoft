<?php

namespace App\Modules\Synchronization\Commands;

use App\Modules\Synchronization\Enums\SyncNodeType;
use App\Modules\Synchronization\Services\SyncNodeService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class RegisterSyncNodeCommand extends Command
{
    protected $signature = 'sync:node-register
        {code : Código único del nodo}
        {--name= : Nombre descriptivo}
        {--type=mobile : administrator, central o mobile}
        {--url= : URL base del nodo}
        {--id= : UUID estable; se genera uno si se omite}';

    protected $description = 'Registra un nodo conocido y genera su token de autenticación';

    public function handle(SyncNodeService $nodes): int
    {
        $data = [
            'code' => (string) $this->argument('code'),
            'name' => (string) ($this->option('name') ?: $this->argument('code')),
            'type' => (string) $this->option('type'),
            'url' => $this->option('url'),
            'id' => $this->option('id'),
        ];

        $validator = Validator::make($data, [
            'code' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:100'],
            'type' => ['required', Rule::enum(SyncNodeType::class)],
            'url' => ['nullable', 'url', 'max:255'],
            'id' => ['nullable', 'uuid'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $result = $nodes->register(
            $data['code'],
            $data['name'],
            SyncNodeType::from($data['type']),
            $data['url'] ?: null,
            $data['id'] ?: null,
        );

        $this->info("Nodo registrado: {$result['node']->id}");
        $this->warn('Guarda este token ahora; no volverá a mostrarse:');
        $this->line($result['token']);

        return self::SUCCESS;
    }
}
