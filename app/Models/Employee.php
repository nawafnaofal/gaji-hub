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

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
        ->logFillable()
        ->logOnlyDirty()
        ->dontSubmitEmptyLogs();
    }
}
