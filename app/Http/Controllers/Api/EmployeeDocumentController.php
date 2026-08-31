<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\EmployeeDocument;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class EmployeeDocumentController extends Controller
{
    public function index($employeeId)
    {
        $user = Auth::user();
        if ($user->role === 'employee' && $user->employee->id != $employeeId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $documents = EmployeeDocument::where('employee_id', $employeeId)->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $documents]);
    }

    public function store(Request $request, $employeeId)
    {
        $user = Auth::user();
        if ($user->role === 'employee' && $user->employee->id != $employeeId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120', // Max 5MB
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('employee_documents/' . $employeeId, $fileName, 'public');

            $document = EmployeeDocument::create([
                'employee_id' => $employeeId,
                'title' => $request->title,
                'file_path' => '/storage/' . $filePath,
                'file_type' => $file->getClientOriginalExtension(),
            ]);

            return response()->json(['success' => true, 'data' => $document]);
        }

        return response()->json(['success' => false, 'message' => 'File tidak ditemukan.'], 400);
    }

    public function destroy($id)
    {
        $document = EmployeeDocument::findOrFail($id);
        
        $user = Auth::user();
        if ($user->role === 'employee' && $user->employee->id != $document->employee_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $filePath = str_replace('/storage/', '', $document->file_path);
        if (Storage::disk('public')->exists($filePath)) {
            Storage::disk('public')->delete($filePath);
        }

        $document->delete();

        return response()->json(['success' => true, 'message' => 'Dokumen berhasil dihapus.']);
    }
}
