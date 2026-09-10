<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class Overtime extends Model
{
    protected $fillable = [
        'employee_id',
        'date',
        'start_time',
        'end_time',
        'duration_hours',
        'day_type',
        'hourly_rate',
        'multiplier_hours',
        'total_pay',
        'breakdown',
        'reason',
        'status',
    ];

    protected $casts = [
        'duration_hours' => 'float',
        'hourly_rate' => 'float',
        'multiplier_hours' => 'float',
        'total_pay' => 'float',
        'breakdown' => 'array',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Kalkulasi upah lembur resmi berdasarkan PP No. 35 Tahun 2021 & Kepmenakertrans 102/2004.
     * Upah per jam = 1/173 x Upah Sebulan (Gaji Pokok + Tunjangan Tetap)
     */
    public static function calculateDepnaker($employee, $date, $durationHours, $overrideDayType = null): array
    {
        if (is_numeric($employee)) {
            $employee = Employee::find($employee);
        }

        $dateCarbon = Carbon::parse($date);
        
        // Deteksi hari libur nasional atau weekend
        $isWeekend = $dateCarbon->isWeekend();
        $isHolidayCalendar = Holiday::where('date', $dateCarbon->toDateString())->exists();
        $autoDetectedHoliday = $isWeekend || $isHolidayCalendar;

        $dayType = $overrideDayType ?: ($autoDetectedHoliday ? 'holiday' : 'workday');

        // Upah per jam: 1/173 x gaji pokok
        $baseWage = $employee ? (float) ($employee->basic_salary ?? 0) : 0;
        $hourlyRate = $baseWage > 0 ? round($baseWage / 173) : 0;

        $duration = max(0.5, (float) $durationHours);
        $breakdown = [];
        $totalMultiplierHours = 0;

        if ($dayType === 'holiday') {
            // Sesuai PP 35/2021 Pasal 31: 
            // Jam 1 s/d 8: 2.0x
            // Jam 9: 3.0x
            // Jam 10+: 4.0x
            $hoursTier1 = min($duration, 8.0);
            if ($hoursTier1 > 0) {
                $mult = 2.0;
                $mHours = $hoursTier1 * $mult;
                $subtotal = round($mHours * $hourlyRate);
                $totalMultiplierHours += $mHours;
                $breakdown[] = [
                    'tier' => 'Jam 1 - 8 (Hari Libur)',
                    'hours' => $hoursTier1,
                    'multiplier' => $mult,
                    'equivalent_hours' => $mHours,
                    'rate' => $hourlyRate,
                    'subtotal' => $subtotal,
                ];
            }

            if ($duration > 8.0) {
                $hoursTier2 = min($duration - 8.0, 1.0);
                $mult = 3.0;
                $mHours = $hoursTier2 * $mult;
                $subtotal = round($mHours * $hourlyRate);
                $totalMultiplierHours += $mHours;
                $breakdown[] = [
                    'tier' => 'Jam ke-9 (Hari Libur)',
                    'hours' => $hoursTier2,
                    'multiplier' => $mult,
                    'equivalent_hours' => $mHours,
                    'rate' => $hourlyRate,
                    'subtotal' => $subtotal,
                ];
            }

            if ($duration > 9.0) {
                $hoursTier3 = $duration - 9.0;
                $mult = 4.0;
                $mHours = $hoursTier3 * $mult;
                $subtotal = round($mHours * $hourlyRate);
                $totalMultiplierHours += $mHours;
                $breakdown[] = [
                    'tier' => 'Jam ke-10+ (Hari Libur)',
                    'hours' => $hoursTier3,
                    'multiplier' => $mult,
                    'equivalent_hours' => $mHours,
                    'rate' => $hourlyRate,
                    'subtotal' => $subtotal,
                ];
            }
        } else {
            // Hari Kerja Biasa:
            // Jam ke-1: 1.5x
            // Jam ke-2 dan seterusnya: 2.0x
            $hoursTier1 = min($duration, 1.0);
            $mult1 = 1.5;
            $mHours1 = $hoursTier1 * $mult1;
            $subtotal1 = round($mHours1 * $hourlyRate);
            $totalMultiplierHours += $mHours1;
            $breakdown[] = [
                'tier' => 'Jam Pertama (1.5x)',
                'hours' => $hoursTier1,
                'multiplier' => $mult1,
                'equivalent_hours' => $mHours1,
                'rate' => $hourlyRate,
                'subtotal' => $subtotal1,
            ];

            if ($duration > 1.0) {
                $hoursTier2 = $duration - 1.0;
                $mult2 = 2.0;
                $mHours2 = $hoursTier2 * $mult2;
                $subtotal2 = round($mHours2 * $hourlyRate);
                $totalMultiplierHours += $mHours2;
                $breakdown[] = [
                    'tier' => 'Jam Berikutnya (2.0x)',
                    'hours' => $hoursTier2,
                    'multiplier' => $mult2,
                    'equivalent_hours' => $mHours2,
                    'rate' => $hourlyRate,
                    'subtotal' => $subtotal2,
                ];
            }
        }

        $totalPay = round($totalMultiplierHours * $hourlyRate);

        return [
            'date' => $dateCarbon->toDateString(),
            'day_name' => $dateCarbon->translatedFormat('l'),
            'day_type' => $dayType,
            'is_weekend' => $isWeekend,
            'is_holiday_calendar' => $isHolidayCalendar,
            'basic_salary' => $baseWage,
            'hourly_rate' => $hourlyRate,
            'duration_hours' => round($duration, 2),
            'multiplier_hours' => round($totalMultiplierHours, 2),
            'total_pay' => $totalPay,
            'breakdown' => $breakdown,
        ];
    }
}
