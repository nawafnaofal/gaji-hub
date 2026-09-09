<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Requests\OvertimeRequest;
use App\Models\Overtime;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class OvertimeController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $perPage = $request->query('per_page', 25);

        $query = Overtime::with('employee.user')->orderBy('created_at', 'desc');

        if ($user->role === 'employee') {
            $employeeId = $user->employee ? $user->employee->id : 0;
            $query->where('employee_id', $employeeId);
        }

        // Filter by status
        if ($request->query('status')) {
            $query->where('status', $request->query('status'));
        }

        // Search by employee name
        if ($request->query('search')) {
            $search = $request->query('search');
            $query->whereHas('employee.user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $overtimes = $query->paginate($perPage);

        return response()->json(['success' => true, 'data' => $overtimes]);
    }

    public function store(OvertimeRequest $request)
    {
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

        return DB::transaction(function () use ($request, $employee, $durationHours) {
            $status = 'pending_hr';
            if ($employee->manager_id) {
                $status = 'pending_manager';
                // Approval Delegation: Jika manajer cuti hari ini, otomatis eskalasi ke HR
                $isManagerOnLeave = \App\Models\Leave::where('employee_id', $employee->manager_id)
                    ->where('status', 'approved')
                    ->where('start_date', '<=', Carbon::today()->toDateString())
                    ->where('end_date', '>=', Carbon::today()->toDateString())
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

            Log::info('[OVERTIME] Employee #{id} submitted overtime request', [
                'id' => $employee->id,
                'name' => $employee->user->name,
                'date' => $request->date,
                'duration_hours' => $durationHours,
                'status' => $status,
            ]);

            $this->notifyManagerOrHR(
                $employee,
                'Pengajuan Lembur Baru',
                "{$employee->user->name} telah mengajukan lembur.",
                '/overtimes'
            );

            return response()->json(['success' => true, 'data' => $overtime]);
        });
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

        return DB::transaction(function () use ($request, $overtime, $user) {
            $overtime->update(['status' => $request->status]);

            Log::info('[OVERTIME] Overtime #{overtime_id} status updated to {status} by {user}', [
                'overtime_id' => $overtime->id,
                'status' => $request->status,
                'user' => $user->name,
                'employee' => $overtime->employee->user->name ?? 'unknown',
            ]);

            if ($request->status === 'approved') {
                $this->notifyEmployee($overtime->employee, 'Lembur Disetujui', 'Pengajuan lembur Anda telah disetujui.', '/overtimes', 'success');
            } elseif ($request->status === 'rejected') {
                $this->notifyEmployee($overtime->employee, 'Lembur Ditolak', 'Pengajuan lembur Anda ditolak.', '/overtimes', 'error');
            } elseif ($request->status === 'pending_hr') {
                $this->notifyHR('Persetujuan Lanjutan Lembur', "Pengajuan lembur oleh {$overtime->employee->user->name} disetujui oleh manajer dan menunggu persetujuan Anda.", '/overtimes');
            }

            return response()->json(['success' => true, 'data' => $overtime]);
        });
    }
}
