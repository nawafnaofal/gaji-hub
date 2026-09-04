<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class OkrProgress extends Model
{
    use HasFactory;

    protected $fillable = [
        'key_result_id',
        'progress_value',
        'notes',
    ];

    public function keyResult()
    {
        return $this->belongsTo(KeyResult::class);
    }
}
