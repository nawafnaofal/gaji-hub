<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Thr extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'period_year',
        'religious_holiday',
        'service_months',
        'basic_salary',
        'fixed_allowance',
        'thr_amount',
        'tax_pph21',
        'net_amount',
        'status',
        'payment_date',
        'notes',
    ];

    protected $casts = [
        'period_year' => 'integer',
        'service_months' => 'float',
        'basic_salary' => 'float',
        'fixed_allowance' => 'float',
        'thr_amount' => 'float',
        'tax_pph21' => 'float',
        'net_amount' => 'float',
        'payment_date' => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
