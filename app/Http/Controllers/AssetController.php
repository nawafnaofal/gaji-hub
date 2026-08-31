<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Asset;
use Illuminate\Support\Facades\Auth;

class AssetController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if ($user->role === 'employee') {
            if (!$user->employee) return response()->json(['success' => true, 'data' => []]);
            $assets = Asset::with('employee.user')->where('employee_id', $user->employee->id)->get();
        } else {
            $assets = Asset::with('employee.user')->get();
        }
        return response()->json(['success' => true, 'data' => $assets]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'hr'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string',
            'type' => 'required|string',
            'serial_number' => 'nullable|string',
            'status' => 'required|in:available,borrowed,broken',
            'employee_id' => 'nullable|exists:employees,id',
            'notes' => 'nullable|string'
        ]);

        $asset = Asset::create($request->all());

        return response()->json(['success' => true, 'data' => $asset]);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'hr'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string',
            'type' => 'required|string',
            'status' => 'required|in:available,borrowed,broken',
            'employee_id' => 'nullable|exists:employees,id'
        ]);

        $asset = Asset::findOrFail($id);
        
        // Validasi kustom: Jika status "borrowed", employee_id harus ada.
        if ($request->status === 'borrowed' && !$request->employee_id) {
            return response()->json(['success' => false, 'message' => 'Status Dipinjam membutuhkan data Karyawan.'], 400);
        }

        // Jika status "available" atau "broken", lepaskan employee
        $data = $request->all();
        if ($request->status !== 'borrowed') {
            $data['employee_id'] = null;
        }

        $asset->update($data);

        return response()->json(['success' => true, 'data' => $asset]);
    }

    public function destroy($id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'hr'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $asset = Asset::findOrFail($id);
        $asset->delete();

        return response()->json(['success' => true]);
    }
}
