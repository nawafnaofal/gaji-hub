<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index()
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        
        return response()->json([
            'success' => true,
            'data' => [
                'unread_count' => $user->unreadNotifications->count(),
                'notifications' => $user->notifications()->take(20)->get()
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
