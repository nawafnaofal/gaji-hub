<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class KeyResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'objective_id',
        'title',
        'target_value',
        'current_value',
        'unit',
    ];

    public function objective()
    {
        return $this->belongsTo(Objective::class);
    }

    public function progress()
    {
        return $this->hasMany(OkrProgress::class);
    }
}
