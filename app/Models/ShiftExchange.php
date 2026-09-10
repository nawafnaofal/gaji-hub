<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShiftExchange extends Model
{
    use HasFactory;

    protected $fillable = [
        'requester_id',
        'requester_shift_id',
        'target_employee_id',
        'target_shift_id',
        'reason',
        'status',
        'peer_approved_at',
        'manager_approved_at',
        'approved_by',
        'rejection_reason',
    ];

    protected $casts = [
        'peer_approved_at' => 'datetime',
        'manager_approved_at' => 'datetime',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'requester_id');
    }

    public function requesterShift(): BelongsTo
    {
        return $this->belongsTo(EmployeeShift::class, 'requester_shift_id');
    }

    public function targetEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'target_employee_id');
    }

    public function targetShift(): BelongsTo
    {
        return $this->belongsTo(EmployeeShift::class, 'target_shift_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
