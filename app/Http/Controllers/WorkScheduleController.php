<?php

namespace App\Http\Controllers;

use App\Models\WorkSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WorkScheduleController extends Controller
{
    public function index()
    {
        $schedules = WorkSchedule::withCount('employees')->orderBy('name')->get();
        return response()->json(['success' => true, 'data' => $schedules]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'clock_in_time' => 'required|date_format:H:i',
            'clock_out_time' => 'required|date_format:H:i',
            'work_days' => 'required|array|min:1',
            'work_days.*' => 'integer|between:0,6',
            'late_tolerance_minutes' => 'nullable|integer|min:0|max:120',
            'description' => 'nullable|string',
        ]);

        $schedule = WorkSchedule::create([
            'name' => $request->name,
            'clock_in_time' => $request->clock_in_time . ':00',
            'clock_out_time' => $request->clock_out_time . ':00',
            'work_days' => $request->work_days,
            'late_tolerance_minutes' => $request->late_tolerance_minutes ?? 15,
            'description' => $request->description,
            'is_active' => true,
        ]);

        return response()->json(['success' => true, 'data' => $schedule]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'clock_in_time' => 'required|date_format:H:i',
            'clock_out_time' => 'required|date_format:H:i',
            'work_days' => 'required|array|min:1',
            'work_days.*' => 'integer|between:0,6',
            'late_tolerance_minutes' => 'nullable|integer|min:0|max:120',
        ]);

        $schedule = WorkSchedule::findOrFail($id);
        $schedule->update([
            'name' => $request->name,
            'clock_in_time' => $request->clock_in_time . ':00',
            'clock_out_time' => $request->clock_out_time . ':00',
            'work_days' => $request->work_days,
            'late_tolerance_minutes' => $request->late_tolerance_minutes ?? 15,
            'description' => $request->description,
        ]);

        return response()->json(['success' => true, 'data' => $schedule]);
    }

    public function destroy($id)
    {
        $schedule = WorkSchedule::findOrFail($id);
        // Unassign employees first
        $schedule->employees()->update(['work_schedule_id' => null]);
        $schedule->delete();
        return response()->json(['success' => true]);
    }

    public function assignToEmployee(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'work_schedule_id' => 'nullable|exists:work_schedules,id',
        ]);

        \App\Models\Employee::find($request->employee_id)
            ->update(['work_schedule_id' => $request->work_schedule_id]);

        return response()->json(['success' => true, 'message' => 'Jadwal berhasil diassign.']);
    }
}
