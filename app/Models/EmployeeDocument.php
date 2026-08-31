<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeDocument extends Model
{
    protected $fillable = [
        'employee_id',
        'title',
        'file_path',
        'file_type',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
