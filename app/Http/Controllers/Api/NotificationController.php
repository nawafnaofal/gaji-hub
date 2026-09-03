<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index()
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        
        $notifications = [];
        $unreadCount = 0;

        try {
            $dbNotifications = $user->notifications()->take(15)->get();
            $unreadCount = $user->unreadNotifications->count();
            
            foreach ($dbNotifications as $n) {
                $notifications[] = [
                    'id' => $n->id,
                    'title' => $n->data['title'] ?? 'Notifikasi Sistem',
                    'message' => $n->data['message'] ?? '',
                    'url' => $n->data['url'] ?? '#',
                    'read_at' => $n->read_at,
                    'created_at' => $n->created_at ? $n->created_at->diffForHumans() : ''
                ];
            }
        } catch (\Exception $e) {
            // Notifications table fallback
        }

        // If user has few notifications, also attach latest company announcements
        $announcements = \App\Models\Announcement::where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get();

        foreach ($announcements as $ann) {
            $notifications[] = [
                'id' => 'ann-' . $ann->id,
                'title' => '📢 ' . $ann->title,
                'message' => \Illuminate\Support\Str::limit($ann->content, 60),
                'url' => '/dashboard',
                'read_at' => null,
                'created_at' => $ann->created_at ? $ann->created_at->diffForHumans() : ''
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'unread_count' => $unreadCount + ($announcements->count() > 0 && count($notifications) === $announcements->count() ? 1 : 0),
                'notifications' => $notifications
            ]
        ]);
    }

    public function markAsRead($id)
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        $notification = $user->notifications()->find($id);
        
        if ($notification) {
            $notification->markAsRead();
        }

        return response()->json(['success' => true]);
    }

    public function markAllAsRead()
    {
        \Illuminate\Support\Facades\Auth::user()->unreadNotifications->markAsRead();
        return response()->json(['success' => true]);
    }
}
