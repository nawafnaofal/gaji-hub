<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LeaveRequest;
use Illuminate\Http\Request;

use App\Models\Leave;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $perPage = $request->query('per_page', 25);

        $query = Leave::with('employee.user')->orderBy('created_at', 'desc');

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

        $leaves = $query->paginate($perPage);

        return response()->json(['success' => true, 'data' => $leaves]);
    }

    public function calendar(Request $request)
    {
        $month = $request->query('month', Carbon::now()->month);
        $year = $request->query('year', Carbon::now()->year);

        $leaves = Leave::with('employee.user')
            ->where('status', 'approved')
            ->where(function($q) use ($month, $year) {
                $q->where(function($sub) use ($month, $year) {
                    $sub->whereMonth('start_date', $month)->whereYear('start_date', $year);
                })->orWhere(function($sub) use ($month, $year) {
                    $sub->whereMonth('end_date', $month)->whereYear('end_date', $year);
                });
            })
            ->get()
            ->map(function($l) {
                return [
                    'id' => $l->id,
                    'employee_name' => $l->employee->user->name ?? 'Karyawan',
                    'department' => $l->employee->department_id ?? '-',
                    'type' => $l->type,
                    'start_date' => $l->start_date,
                    'end_date' => $l->end_date,
                    'reason' => $l->reason
                ];
            });

        $holidays = \App\Models\Holiday::whereMonth('date', $month)
            ->whereYear('date', $year)
            ->get();

        return response()->json([
            'success' => true,
            'leaves' => $leaves,
            'holidays' => $holidays
        ]);
    }

    // Employee applies for leave
    public function store(LeaveRequest $request)
    {
        $employee = Auth::user()->employee;
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Anda belum terdaftar sebagai karyawan.'], 403);
        }

        $startDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);
        
        $overlappingLeave = Leave::where('employee_id', $employee->id)
            ->whereIn('status', ['pending_manager', 'pending_hr', 'approved'])
            ->where(function ($query) use ($request) {
                $query->whereBetween('start_date', [$request->start_date, $request->end_date])
                      ->orWhereBetween('end_date', [$request->start_date, $request->end_date])
                      ->orWhere(function ($q) use ($request) {
                          $q->where('start_date', '<=', $request->start_date)
                            ->where('end_date', '>=', $request->end_date);
                      });
            })
            ->exists();

        if ($overlappingLeave) {
            return response()->json(['success' => false, 'message' => 'Anda sudah memiliki pengajuan cuti pada tanggal tersebut.'], 400);
        }

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

        return DB::transaction(function () use ($request, $employee, $startDate, $endDate) {
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
            ]);

            $status = 'pending_hr';
            if ($employee->manager_id) {
                $status = 'pending_manager';
                // Approval Delegation: Jika manajer cuti hari ini, otomatis eskalasi ke HR
                $isManagerOnLeave = Leave::where('employee_id', $employee->manager_id)
                    ->where('status', 'approved')
                    ->where('start_date', '<=', Carbon::today()->toDateString())
                    ->where('end_date', '>=', Carbon::today()->toDateString())
                    ->exists();
                    
                if ($isManagerOnLeave) {
                    $status = 'pending_hr';
                }
            }
            $leave->status = $status;
            $leave->save();

            Log::info('[LEAVE] Employee #{id} submitted leave request', [
                'id' => $employee->id,
                'name' => $employee->user->name,
                'type' => $request->type,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'status' => $status,
            ]);

            $this->notifyManagerOrHR(
                $employee,
                'Pengajuan Cuti Baru',
                "{$employee->user->name} telah mengajukan cuti.",
                '/leaves'
            );

            return response()->json(['success' => true, 'data' => $leave]);
        });
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

        return DB::transaction(function () use ($request, $leave, $user) {
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
                        throw new \Exception('Kuota cuti tidak cukup untuk di-approve.');
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

            Log::info('[LEAVE] Leave #{leave_id} status updated to {status} by {user}', [
                'leave_id' => $leave->id,
                'status' => $request->status,
                'user' => $user->name,
                'employee' => $leave->employee->user->name ?? 'unknown',
            ]);

            if ($request->status === 'approved') {
                $this->notifyEmployee($leave->employee, 'Cuti Disetujui', 'Pengajuan cuti Anda telah disetujui.', '/leaves', 'success');
            } elseif ($request->status === 'rejected') {
                $this->notifyEmployee($leave->employee, 'Cuti Ditolak', 'Pengajuan cuti Anda ditolak.', '/leaves', 'error');
            } elseif ($request->status === 'pending_hr') {
                $this->notifyHR('Persetujuan Lanjutan Cuti', "Pengajuan cuti oleh {$leave->employee->user->name} disetujui oleh manajer dan menunggu persetujuan Anda.", '/leaves');
            }

            return response()->json(['success' => true, 'data' => $leave]);
        });
    }
}
