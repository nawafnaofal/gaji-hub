<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resignation extends Model
{
    protected $fillable = [
        'employee_id', 'resign_date', 'reason', 'type', 'status',
        'severance_pay', 'upmk_pay', 'uph_pay'
    ];

    public function employee() {
        return $this->belongsTo(Employee::class);
    }
}
