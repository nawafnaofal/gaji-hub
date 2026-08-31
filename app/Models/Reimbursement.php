<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reimbursement extends Model
{
    protected $fillable = [
        'employee_id',
        'date',
        'description',
        'amount',
        'status',
        'attachment',
    ];

    protected $appends = ['attachment_url'];

    public function getAttachmentUrlAttribute()
    {
        return $this->attachment ? asset('storage/' . $this->attachment) : null;
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
