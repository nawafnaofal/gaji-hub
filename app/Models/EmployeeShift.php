<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeShift extends Model
{
    protected $fillable = ['employee_id', 'work_schedule_id', 'date'];

    public function employee() {
        return $this->belongsTo(Employee::class);
    }

    public function workSchedule() {
        return $this->belongsTo(WorkSchedule::class);
    }
}
