<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AnnouncementRead;
use App\Models\Employee;
use App\Models\User;
use App\Notifications\GenericNotification;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Announcement::with('creator')->withCount('reads');

        if ($user->role === 'employee') {
            $query->where('is_active', true)->forUser($user);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        // Pinned announcements always on top, followed by newest
        $announcements = $query->orderBy('is_pinned', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $totalEmployees = Employee::count();
        $userReadIds = AnnouncementRead::where('user_id', $user->id)
            ->pluck('announcement_id')
            ->toArray();

        $data = $announcements->map(function ($ann) use ($userReadIds, $totalEmployees) {
            $arr = $ann->toArray();
            $arr['is_read_by_me'] = in_array($ann->id, $userReadIds);
            $arr['total_employees'] = $totalEmployees;
            $arr['read_percentage'] = $totalEmployees > 0 ? round(($ann->reads_count / $totalEmployees) * 100) : 0;
            return $arr;
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'summary' => [
                'total' => $announcements->count(),
                'unread' => $announcements->filter(fn($a) => !in_array($a->id, $userReadIds))->count(),
                'pinned' => $announcements->where('is_pinned', true)->count(),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'nullable|in:general,policy,event,urgent',
            'is_pinned' => 'nullable|boolean',
            'target_department' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',
        ]);

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('announcements', 'public');
        }

        $announcement = Announcement::create([
            'title' => $request->title,
            'content' => $request->content,
            'category' => $request->input('category', 'general'),
            'is_pinned' => $request->boolean('is_pinned'),
            'target_department' => $request->target_department ?: null,
            'attachment_path' => $attachmentPath,
            'is_active' => true,
            'created_by' => Auth::id(),
        ]);

        // Auto mark as read for creator
        AnnouncementRead::create([
            'announcement_id' => $announcement->id,
            'user_id' => Auth::id(),
            'read_at' => Carbon::now(),
        ]);

        // If urgent, blast notification to all active employees
        if ($announcement->category === 'urgent') {
            $employees = User::where('role', 'employee')->get();
            foreach ($employees as $empUser) {
                $empUser->notify(new GenericNotification(
                    'PENGUMUMAN PENTING: ' . $announcement->title,
                    substr(strip_tags($announcement->content), 0, 120) . '...',
                    '/announcements',
                    'warning'
                ));
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman perusahaan berhasil disiarkan.',
            'data' => $announcement->load('creator')
        ]);
    }

    public function togglePin($id)
    {
        $announcement = Announcement::findOrFail($id);
        $announcement->update(['is_pinned' => !$announcement->is_pinned]);

        return response()->json([
            'success' => true,
            'message' => $announcement->is_pinned ? 'Pengumuman berhasil disematkan (pinned).' : 'Sematkan dilepas.',
            'data' => $announcement
        ]);
    }

    public function markAsRead($id)
    {
        $announcement = Announcement::findOrFail($id);
        $user = Auth::user();

        $read = AnnouncementRead::firstOrCreate(
            [
                'announcement_id' => $announcement->id,
                'user_id' => $user->id,
            ],
            [
                'read_at' => Carbon::now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman telah ditandai dibaca.',
            'data' => $read
        ]);
    }

    public function readStats($id)
    {
        $announcement = Announcement::with('reads.user')->findOrFail($id);
        
        $readers = $announcement->reads->map(function ($read) {
            return [
                'user_id' => $read->user_id,
                'name' => $read->user->name ?? 'Karyawan',
                'email' => $read->user->email ?? '-',
                'department' => $read->user->employee->department ?? '-',
                'read_at' => $read->read_at ? $read->read_at->format('d M Y H:i') : '-',
            ];
        });

        $readUserIds = $announcement->reads->pluck('user_id')->toArray();
        $unreaders = User::where('role', 'employee')
            ->whereNotIn('id', $readUserIds)
            ->with('employee')
            ->get()
            ->map(function ($u) {
                return [
                    'user_id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'department' => $u->employee->department ?? '-',
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'readers' => $readers,
                'unreaders' => $unreaders,
                'total_read' => $readers->count(),
                'total_unread' => $unreaders->count(),
            ]
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'is_active' => 'required|boolean'
        ]);

        $announcement = Announcement::findOrFail($id);
        $announcement->update(['is_active' => $request->is_active]);

        return response()->json([
            'success' => true,
            'message' => 'Status pengumuman diupdate.',
            'data' => $announcement
        ]);
    }

    public function destroy($id)
    {
        $announcement = Announcement::findOrFail($id);
        if ($announcement->attachment_path) {
            Storage::disk('public')->delete($announcement->attachment_path);
        }
        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil dihapus.'
        ]);
    }
}
