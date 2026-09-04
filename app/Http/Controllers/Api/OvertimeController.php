<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Overtime;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class OvertimeController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if ($user->role === 'employee') {
            $employeeId = $user->employee ? $user->employee->id : 0;
            $overtimes = Overtime::with('employee.user')
                ->where('employee_id', $employeeId)
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            $overtimes = Overtime::with('employee.user')->orderBy('created_at', 'desc')->get();
        }

        return response()->json(['success' => true, 'data' => $overtimes]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
            'reason' => 'required|string',
        ]);

        $employee = Auth::user()->employee;
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Anda belum terdaftar sebagai karyawan.'], 403);
        }

        $start = Carbon::parse($request->start_time);
        $end = Carbon::parse($request->end_time);
        if ($end->lt($start)) {
            $end->addDay();
        }
        $durationHours = max(0.5, round($end->diffInMinutes($start) / 60, 2));

        $status = 'pending_hr';
        if ($employee->manager_id) {
            $status = 'pending_manager';
            // Approval Delegation: Jika manajer cuti hari ini, otomatis eskalasi ke HR
            $isManagerOnLeave = \App\Models\Leave::where('employee_id', $employee->manager_id)
                ->where('status', 'approved')
                ->where('start_date', '<=', \Carbon\Carbon::today()->toDateString())
                ->where('end_date', '>=', \Carbon\Carbon::today()->toDateString())
                ->exists();
                
            if ($isManagerOnLeave) {
                $status = 'pending_hr';
            }
        }

        $overtime = Overtime::create([
            'employee_id' => $employee->id,
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'duration_hours' => $durationHours,
            'reason' => $request->reason,
            'status' => $status
        ]);

        $this->notifyManagerOrHR(
            $employee,
            'Pengajuan Lembur Baru',
            "{$employee->user->name} telah mengajukan lembur.",
            '/overtimes'
        );

        return response()->json(['success' => true, 'data' => $overtime]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected,pending_hr'
        ]);

        $overtime = Overtime::findOrFail($id);
        
        $user = Auth::user();
        if ($user->role === 'employee') {
            if ($overtime->employee->manager_id !== $user->employee->id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }
            if ($overtime->status !== 'pending_manager') {
                return response()->json(['success' => false, 'message' => 'Invalid state'], 400);
            }
            if (!in_array($request->status, ['pending_hr', 'rejected'])) {
                return response()->json(['success' => false, 'message' => 'Manager hanya bisa meneruskan ke HR atau menolak.'], 400);
            }
        } else {
            if ($request->status === 'pending_hr') {
                return response()->json(['success' => false, 'message' => 'Invalid status for HR.'], 400);
            }
        }

        $overtime->update(['status' => $request->status]);

        if ($request->status === 'approved') {
            $this->notifyEmployee($overtime->employee, 'Lembur Disetujui', 'Pengajuan lembur Anda telah disetujui.', '/overtimes', 'success');
        } elseif ($request->status === 'rejected') {
            $this->notifyEmployee($overtime->employee, 'Lembur Ditolak', 'Pengajuan lembur Anda ditolak.', '/overtimes', 'error');
        } elseif ($request->status === 'pending_hr') {
            $this->notifyHR('Persetujuan Lanjutan Lembur', "Pengajuan lembur oleh {$overtime->employee->user->name} disetujui oleh manajer dan menunggu persetujuan Anda.", '/overtimes');
        }

        return response()->json(['success' => true, 'data' => $overtime]);
    }
}
