<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Objective;
use App\Models\KeyResult;
use App\Models\OkrProgress;
use Illuminate\Support\Facades\Auth;

class OkrController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $isHrOrAdmin = in_array($user->role, ['admin', 'hr']);

        if ($isHrOrAdmin) {
            $objectives = Objective::with(['keyResults.progress', 'employee.user'])->orderBy('created_at', 'desc')->get();
        } else {
            $employee = $user->employee;
            $employeeId = $employee ? $employee->id : 0;
            $objectives = Objective::with(['keyResults.progress', 'employee.user'])
                ->where('employee_id', $employeeId)
                ->orderBy('created_at', 'desc')
                ->get();
        }
        return response()->json(['data' => $objectives]);
    }

    public function storeObjective(Request $request)
    {
        $employeeId = $request->employee_id ?: Auth::user()->employee?->id;
        if (!$employeeId) {
            $employeeId = \App\Models\Employee::first()?->id;
        }

        $request->merge(['employee_id' => $employeeId]);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'employee_id' => 'required|exists:employees,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'description' => 'nullable|string'
        ]);
        
        $obj = Objective::create([
            'title' => $validated['title'],
            'description' => $request->description,
            'employee_id' => $validated['employee_id'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'status' => 'on_track'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Objective berhasil dibuat.',
            'data' => $obj->load(['keyResults.progress', 'employee.user'])
        ]);
    }

    public function storeKeyResult(Request $request)
    {
        $validated = $request->validate([
            'objective_id' => 'required',
            'title' => 'required',
            'target_value' => 'required|numeric'
        ]);

        $kr = KeyResult::create($request->all());
        return response()->json(['success' => true, 'data' => $kr]);
    }

    public function updateProgress(Request $request, $krId)
    {
        $kr = KeyResult::findOrFail($krId);
        $kr->update(['current_value' => $request->current_value]);

        OkrProgress::create([
            'key_result_id' => $kr->id,
            'progress_value' => $request->current_value,
            'notes' => $request->notes
        ]);

        return response()->json(['success' => true]);
    }
}
