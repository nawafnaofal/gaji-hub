<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkSchedule extends Model
{
    protected $fillable = [
        'name',
        'clock_in_time',
        'clock_out_time',
        'work_days',
        'late_tolerance_minutes',
        'description',
        'is_active',
    ];

    protected $casts = [
        'work_days' => 'array',
        'is_active' => 'boolean',
    ];

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function getWorkDayNamesAttribute()
    {
        $days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return collect($this->work_days)->map(fn($d) => $days[$d])->join(', ');
    }
}
