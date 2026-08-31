<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AnnouncementController extends Controller
{
    public function index()
    {
        // For employee, fetch only active. For HR/Admin, fetch all.
        $user = Auth::user();
        $query = Announcement::with('creator');
        
        if ($user->role === 'employee') {
            $query->where('is_active', true);
        }
        
        $announcements = $query->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $announcements]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_active' => 'boolean'
        ]);

        $announcement = Announcement::create(array_merge(
            $request->all(),
            ['created_by' => Auth::id()]
        ));

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil dibuat.',
            'data' => $announcement->load('creator')
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
        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman dihapus.'
        ]);
    }
}
