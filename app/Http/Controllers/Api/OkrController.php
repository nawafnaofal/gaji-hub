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
        $employee = Auth::user()->employee;
        if (!$employee) {
            $objectives = Objective::with(['keyResults.progress', 'employee'])->get();
        } else {
            $objectives = Objective::with(['keyResults.progress'])->where('employee_id', $employee->id)->get();
        }
        return response()->json(['data' => $objectives]);
    }

    public function storeObjective(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required',
            'employee_id' => 'required',
            'start_date' => 'required|date',
            'end_date' => 'required|date'
        ]);
        
        $obj = Objective::create($request->all());
        return response()->json(['success' => true, 'data' => $obj]);
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
