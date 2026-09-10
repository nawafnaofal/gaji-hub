<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'category', // general, policy, event, urgent
        'content',
        'attachment_path',
        'target_department',
        'is_pinned',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_pinned' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reads()
    {
        return $this->hasMany(AnnouncementRead::class);
    }

    public function readers()
    {
        return $this->belongsToMany(User::class, 'announcement_reads')
            ->withPivot('read_at')
            ->withTimestamps();
    }

    public function scopeForUser($query, ?User $user = null)
    {
        if (!$user) return $query;
        if (in_array($user->role, ['admin', 'hr'])) return $query;

        $dept = $user->employee ? $user->employee->department : null;

        return $query->where(function ($q) use ($dept) {
            $q->whereNull('target_department')
              ->orWhere('target_department', '')
              ->orWhere('target_department', 'all');
            if ($dept) {
                $q->orWhere('target_department', $dept);
            }
        });
    }
}
