<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Leave;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class LeaveController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if ($user->role === 'employee') {
            $employeeId = $user->employee ? $user->employee->id : null;
            $leaves = Leave::with('employee.user')
                ->where(function($q) use ($employeeId) {
                    $q->where('employee_id', $employeeId)
                      ->orWhereHas('employee', function($subQ) use ($employeeId) {
                          $subQ->where('manager_id', $employeeId);
                      });
                })->orderBy('created_at', 'desc')->get();
        } else {
            // HR/Admin view all
            $leaves = Leave::with('employee.user')->orderBy('created_at', 'desc')->get();
        }

        return response()->json(['success' => true, 'data' => $leaves]);
    }

    // Employee applies for leave
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:sick,annual,unpaid',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string',
            'attachment' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ]);

        $employee = Auth::user()->employee;
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Anda belum terdaftar sebagai karyawan.'], 403);
        }

        $startDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);
        $requestedDays = $startDate->diffInDaysFiltered(function (Carbon $date) {
            return !$date->isWeekend();
        }, $endDate) + 1;

        if ($request->type === 'annual') {
            if ($employee->leave_balance < $requestedDays) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sisa kuota cuti tahunan Anda (' . $employee->leave_balance . ' hari) tidak mencukupi untuk pengajuan (' . $requestedDays . ' hari).'
                ], 400);
            }
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('leaves', 'public');
        }

        $leave = Leave::create([
            'employee_id' => $employee->id,
            'type' => $request->type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'attachment' => $attachmentPath,
            'status' => $employee->manager_id ? 'pending_manager' : 'pending_hr'
        ]);

        $this->notifyManagerOrHR(
            $employee,
            'Pengajuan Cuti Baru',
            "{$employee->user->name} telah mengajukan cuti.",
            '/leaves'
        );

        return response()->json(['success' => true, 'data' => $leave]);
    }

    // Manager / HR approves/rejects
    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected,pending_hr'
        ]);

        $leave = Leave::findOrFail($id);
        
        // Cek permission: jika role employee dan sebagai manager, dia hanya bisa ubah dari pending_manager ke pending_hr/rejected
        $user = Auth::user();
        if ($user->role === 'employee') {
            if ($leave->employee->manager_id !== $user->employee->id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }
            if ($leave->status !== 'pending_manager') {
                return response()->json(['success' => false, 'message' => 'Invalid state'], 400);
            }
            // Manager hanya bisa menolak atau meneruskan ke HR
            if (!in_array($request->status, ['pending_hr', 'rejected'])) {
                return response()->json(['success' => false, 'message' => 'Manager hanya bisa meneruskan ke HR atau menolak.'], 400);
            }
        } else {
            // HR / Admin
            if ($request->status === 'pending_hr') {
                return response()->json(['success' => false, 'message' => 'Invalid status for HR.'], 400);
            }
        }

        $leave->update(['status' => $request->status]);

        if ($request->status === 'approved') {
            $startDate = Carbon::parse($leave->start_date);
            $endDate = Carbon::parse($leave->end_date);
            $requestedDays = $startDate->diffInDaysFiltered(function (Carbon $date) {
                return !$date->isWeekend();
            }, $endDate) + 1;

            if ($leave->type === 'annual') {
                $employee = $leave->employee;
                if ($employee->leave_balance >= $requestedDays) {
                    $employee->decrement('leave_balance', $requestedDays);
                } else {
                    return response()->json(['success' => false, 'message' => 'Kuota cuti tidak cukup untuk di-approve.'], 400);
                }
            }

            $endDateForLoop = $endDate->copy()->addDay();
            $interval = new \DateInterval('P1D');
            $period = new \DatePeriod($startDate->toDateTime(), $interval, $endDateForLoop->toDateTime());

            foreach ($period as $dt) {
                $currentDate = Carbon::instance($dt);
                if (!$currentDate->isWeekend()) {
                    \App\Models\Attendance::updateOrCreate(
                        ['employee_id' => $leave->employee_id, 'date' => $dt->format('Y-m-d')],
                        ['status' => 'leave']
                    );
                }
            }
        }

        if ($request->status === 'approved') {
            $this->notifyEmployee($leave->employee, 'Cuti Disetujui', 'Pengajuan cuti Anda telah disetujui.', '/leaves', 'success');
        } elseif ($request->status === 'rejected') {
            $this->notifyEmployee($leave->employee, 'Cuti Ditolak', 'Pengajuan cuti Anda ditolak.', '/leaves', 'error');
        } elseif ($request->status === 'pending_hr') {
            $this->notifyHR('Persetujuan Lanjutan Cuti', "Pengajuan cuti oleh {$leave->employee->user->name} disetujui oleh manajer dan menunggu persetujuan Anda.", '/leaves');
        }

        return response()->json(['success' => true, 'data' => $leave]);
    }
}
