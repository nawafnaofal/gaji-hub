<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class ContractCompensation extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'contract_compensations';

    protected $fillable = [
        'employee_id',
        'contract_start_date',
        'contract_end_date',
        'tenure_months',
        'monthly_wage',
        'compensation_amount',
        'status',
        'notes',
        'paid_at',
    ];

    protected $casts = [
        'contract_start_date' => 'date',
        'contract_end_date' => 'date',
        'paid_at' => 'date',
        'tenure_months' => 'integer',
        'monthly_wage' => 'float',
        'compensation_amount' => 'float',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Hitung Uang Kompensasi PKWT resmi sesuai PP No. 35 Tahun 2021 Pasal 15 & 16.
     * Formula: (Masa Kerja Bulan / 12) x 1 Bulan Upah.
     * Syarat: Masa kerja minimal 1 bulan terus-menerus.
     */
    public static function calculateCompensation(Employee $employee, ?string $overrideEndDate = null): array
    {
        $startDate = $employee->join_date ? Carbon::parse($employee->join_date)->startOfDay() : Carbon::now()->startOfDay();
        $endDate = $overrideEndDate 
            ? Carbon::parse($overrideEndDate)->startOfDay() 
            : ($employee->contract_end_date ? Carbon::parse($employee->contract_end_date)->startOfDay() : Carbon::now()->startOfDay());

        $tenureMonths = max(0, (int) $startDate->diffInMonths($endDate));
        $monthlyWage = (float) ($employee->basic_salary ?? 0);

        if ($tenureMonths < 1) {
            $compensationAmount = 0;
            $note = 'Masa kerja kurang dari 1 bulan, belum berhak atas uang kompensasi PKWT sesuai PP 35/2021 Pasal 15.';
        } else {
            $compensationAmount = round(($tenureMonths / 12) * $monthlyWage);
            $note = "Perhitungan resmi PP 35/2021: ({$tenureMonths} bulan / 12) x Rp " . number_format($monthlyWage, 0, ',', '.');
        }

        return [
            'employee_id' => $employee->id,
            'employee_name' => $employee->user->name ?? 'Karyawan',
            'employee_code' => $employee->employee_code,
            'department' => $employee->department,
            'employment_status' => $employee->employment_status,
            'contract_start_date' => $startDate->toDateString(),
            'contract_end_date' => $endDate->toDateString(),
            'tenure_months' => $tenureMonths,
            'monthly_wage' => $monthlyWage,
            'compensation_amount' => $compensationAmount,
            'notes' => $note,
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
