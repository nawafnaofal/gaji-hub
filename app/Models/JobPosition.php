<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class JobPosition extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'department',
        'description',
        'requirements',
        'status',
        'type',
        'location',
        'salary_range',
    ];

    public function applications()
    {
        return $this->hasMany(JobApplication::class);
    }
}
