<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EmployeeSalaryComponent extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'salary_component_id',
        'amount_override',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function salaryComponent()
    {
        return $this->belongsTo(SalaryComponent::class);
    }
}
