<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Employee extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'user_id',
        'department_id',
        'branch_id',
        'employee_code',
        'basic_salary',
        'join_date',
        'job_title',
        'employment_status',
        'bank_name',
        'bank_account',
        'npwp_number',
        'bpjs_kesehatan',
        'bpjs_ketenagakerjaan',
        'phone',
        'address',
        'annual_leave_quota',
        'manager_id',
        'tax_status',
        'position',
        'department',
        'work_schedule_id',
        'resign_date',
        'termination_reason',
        'profile_photo',
    ];

    protected $appends = ['leave_balance'];

    public function getLeaveBalanceAttribute(): int
    {
        $currentYear = \Carbon\Carbon::now()->year;
        $quota = $this->annual_leave_quota ?? 12;
        
        $usedLeaves = Leave::where('employee_id', $this->id)
            ->where('status', 'approved')
            ->where('type', 'annual')
            ->whereYear('start_date', $currentYear)
            ->get()
            ->sum(function ($leave) {
                $start = \Carbon\Carbon::parse($leave->start_date);
                $end = \Carbon\Carbon::parse($leave->end_date);
                return $start->diffInDaysFiltered(function (\Carbon\Carbon $date) {
                    return !$date->isWeekend();
                }, $end) + 1;
            });

        return (int) max(0, $quota - $usedLeaves);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function attendance()
    {
        return $this->hasOne(Attendance::class)->latestOfMany();
    }

    public function workSchedule()
    {
        return $this->belongsTo(WorkSchedule::class);
    }

    public function manager()
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }

    public function subordinates()
    {
        return $this->hasMany(Employee::class, 'manager_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
        ->logFillable()
        ->logOnlyDirty()
        ->dontSubmitEmptyLogs();
    }
}
