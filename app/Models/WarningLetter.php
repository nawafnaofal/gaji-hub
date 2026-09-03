<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class WarningLetter extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'letter_number',
        'sp_level',
        'violation_date',
        'valid_until',
        'description',
        'sanction',
        'status',
        'issued_by'
    ];

    protected $appends = ['is_active'];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'active' && Carbon::parse($this->valid_until)->isFuture();
    }
}
