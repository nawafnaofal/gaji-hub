<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\CompanyDocument;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class CompanyDocumentController extends Controller
{
    public function index()
    {
        $docs = CompanyDocument::orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $docs]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'hr'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'required|string',
            'type' => 'required|string',
            'description' => 'nullable|string',
            'file' => 'required|file|mimes:pdf,doc,docx|max:10240',
        ]);

        $path = $request->file('file')->store('company_documents', 'public');

        $doc = CompanyDocument::create([
            'title' => $request->title,
            'description' => $request->description,
            'type' => $request->type,
            'file_path' => $path
        ]);

        return response()->json(['success' => true, 'data' => $doc]);
    }

    public function destroy($id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'hr'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $doc = CompanyDocument::findOrFail($id);
        if ($doc->file_path) {
            Storage::disk('public')->delete($doc->file_path);
        }
        $doc->delete();

        return response()->json(['success' => true]);
    }
}
