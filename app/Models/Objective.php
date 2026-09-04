<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Objective extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'employee_id',
        'start_date',
        'end_date',
        'status',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function keyResults()
    {
        return $this->hasMany(KeyResult::class);
    }
}
