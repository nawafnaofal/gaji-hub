<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class ApprovalWorkflow extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'module',
        'name',
        'min_amount',
        'max_amount',
        'tiers',
        'is_active',
    ];

    protected $casts = [
        'tiers' => 'array',
        'is_active' => 'boolean',
        'min_amount' => 'float',
        'max_amount' => 'float',
    ];

    /**
     * Cari alur workflow yang cocok untuk modul dan nominal tertentu
     */
    public static function getWorkflowFor(string $module, float $amount = 0): ?self
    {
        self::seedDefaultsIfEmpty();

        $workflow = self::where('module', $module)
            ->where('is_active', true)
            ->where('min_amount', '<=', $amount)
            ->where(function ($q) use ($amount) {
                $q->whereNull('max_amount')
                  ->orWhere('max_amount', '>=', $amount);
            })
            ->orderBy('min_amount', 'desc')
            ->first();

        return $workflow ?: self::where('module', $module)->where('is_active', true)->first();
    }

    /**
     * Auto-seed default multi-tier approval jika belum ada
     */
    public static function seedDefaultsIfEmpty(): void
    {
        if (self::count() > 0) return;

        $defaults = [
            [
                'module' => 'leave',
                'name' => 'Alur Persetujuan Cuti Standar',
                'min_amount' => 0,
                'max_amount' => null,
                'tiers' => [
                    ['level' => 1, 'role' => 'direct_manager', 'label' => 'Atasan Langsung (Manager)'],
                    ['level' => 2, 'role' => 'hr', 'label' => 'HR Department'],
                ],
                'is_active' => true,
            ],
            [
                'module' => 'overtime',
                'name' => 'Alur Persetujuan Lembur Standar',
                'min_amount' => 0,
                'max_amount' => null,
                'tiers' => [
                    ['level' => 1, 'role' => 'direct_manager', 'label' => 'Atasan Langsung (Manager)'],
                    ['level' => 2, 'role' => 'hr', 'label' => 'HR Department'],
                ],
                'is_active' => true,
            ],
            [
                'module' => 'reimbursement',
                'name' => 'Klaim Biaya Operasional / Reimbursement',
                'min_amount' => 0,
                'max_amount' => 5000000,
                'tiers' => [
                    ['level' => 1, 'role' => 'direct_manager', 'label' => 'Atasan Langsung (Manager)'],
                    ['level' => 2, 'role' => 'hr', 'label' => 'HR & Finance Admin'],
                ],
                'is_active' => true,
            ],
            [
                'module' => 'cash_advance',
                'name' => 'Alur Kasbon Karyawan Standar',
                'min_amount' => 0,
                'max_amount' => null,
                'tiers' => [
                    ['level' => 1, 'role' => 'direct_manager', 'label' => 'Atasan Langsung (Manager)'],
                    ['level' => 2, 'role' => 'hr', 'label' => 'HR & Finance Admin'],
                ],
                'is_active' => true,
            ],
        ];

        foreach ($defaults as $d) {
            self::create($d);
        }
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
