<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Payroll;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $user = \Illuminate\Support\Facades\Auth::user();

        if ($user->role === 'employee') {
            $employee = $user->employee;
            if (!$employee) {
                return response()->json(['success' => true, 'data' => []]);
            }

            // Data untuk Dashboard Employee
            $lastPayroll = Payroll::where('employee_id', $employee->id)->orderBy('period_year', 'desc')->orderBy('period_month', 'desc')->first();
            $pendingLeaves = \App\Models\Leave::where('employee_id', $employee->id)->whereIn('status', ['pending_manager', 'pending_hr'])->count();
            $approvedLeaves = \App\Models\Leave::where('employee_id', $employee->id)->where('status', 'approved')->count();
            
            $today = \Carbon\Carbon::today()->format('Y-m-d');
            $todayAttendance = \App\Models\Attendance::where('employee_id', $employee->id)->where('date', $today)->first();
            $hasClockedIn = $todayAttendance && $todayAttendance->clock_in ? true : false;
            $hasClockedOut = $todayAttendance && $todayAttendance->clock_out ? true : false;
            
            $announcements = \App\Models\Announcement::where('is_active', true)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();
                
            $settings = cache()->remember('company_settings_mapped', 86400, function () {
                $all = \App\Models\CompanySetting::all();
                $mappedData = [];
                foreach ($all as $setting) {
                    $mappedData[$setting->key] = $setting->value;
                }
                return $mappedData;
            });

            $branch = $employee->branch;
            if (!$branch || !$branch->is_active) {
                $branch = \App\Models\Branch::where('is_head_office', true)->where('is_active', true)->first();
            }

            if ($branch) {
                $officeLat = (float) $branch->latitude;
                $officeLng = (float) $branch->longitude;
                $officeRadius = (int) $branch->radius_meters;
                $companyName = $branch->name;
            } else {
                $officeLat = (float) ($settings['office_latitude'] ?? -6.151595380868531);
                $officeLng = (float) ($settings['office_longitude'] ?? 106.77652147472021);
                $officeRadius = (int) ($settings['office_radius'] ?? 50);
                $companyName = $settings['company_name'] ?? 'Kantor Pusat';
            }

            $teamPulse = $this->getTeamPulseData($today);
                
            return response()->json([
                'success' => true,
                'data' => [
                    'role' => 'employee',
                    'last_salary' => $lastPayroll ? $lastPayroll->net_salary : 0,
                    'leave_balance' => $employee->leave_balance,
                    'pending_leaves' => $pendingLeaves,
                    'approved_leaves' => $approvedLeaves,
                    'has_clocked_in' => $hasClockedIn,
                    'has_clocked_out' => $hasClockedOut,
                    'today_attendance' => $todayAttendance,
                    'announcements' => $announcements,
                    'geofencing' => [
                        'latitude' => (float) $officeLat,
                        'longitude' => (float) $officeLng,
                        'radius' => (int) $officeRadius,
                        'company_name' => $companyName,
                    ],
                    'team_pulse' => $teamPulse,
                ]
            ]);
        }

        // Data untuk Dashboard HR / Admin
        $totalEmployees = Employee::count();
        $totalPayrollCost = Payroll::where('status', 'paid')->orWhere('status', 'pending')->sum('net_salary'); // Inclusif pending for forecast
        
        $pendingLeavesAdmin = \App\Models\Leave::whereIn('status', ['pending_manager', 'pending_hr'])->count();
        $pendingClaimsAdmin = \App\Models\Reimbursement::whereIn('status', ['pending_manager', 'pending_hr'])->count();

        // Chart data for last 6 months
        $chartData = Payroll::selectRaw('period_month, period_year, sum(net_salary) as total')
            ->groupBy('period_year', 'period_month')
            ->orderBy('period_year', 'desc')
            ->orderBy('period_month', 'desc')
            ->limit(6)
            ->get()
            ->reverse()
            ->map(function ($item) {
                return [
                    'name' => $item->period_month . '/' . $item->period_year,
                    'total' => (float) $item->total,
                ];
            })->values();

        $announcements = \App\Models\Announcement::where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $today = \Carbon\Carbon::today()->format('Y-m-d');
        $attendancesToday = \App\Models\Attendance::where('date', $today)->get();
        $presentCount = $attendancesToday->where('status', 'present')->count();
        $lateCount = $attendancesToday->where('status', 'late')->count();
        $leaveCount = $attendancesToday->where('status', 'leave')->count();
        $absentCount = $attendancesToday->where('status', 'absent')->count();
        // Belum absen (belum ada record) = total employees - (present + late + leave + absent)
        $noRecordCount = $totalEmployees - $attendancesToday->count();
        if ($noRecordCount < 0) $noRecordCount = 0;

        $attendanceStats = [
            ['name' => 'Hadir', 'value' => $presentCount, 'color' => '#10B981'],
            ['name' => 'Terlambat', 'value' => $lateCount, 'color' => '#F59E0B'],
            ['name' => 'Cuti', 'value' => $leaveCount, 'color' => '#3B82F6'],
            ['name' => 'Alpa', 'value' => $absentCount, 'color' => '#EF4444'],
            ['name' => 'Belum Absen', 'value' => $noRecordCount, 'color' => '#9CA3AF'],
        ];

        // Department distribution
        $departmentDist = Employee::selectRaw('department_id as name, count(*) as value')
            ->groupBy('department_id')
            ->get();
            
        // Top KPI
        $topKPI = \App\Models\PerformanceReview::with('employee.user')
            ->orderBy('score', 'desc')
            ->limit(3)
            ->get()
            ->map(function ($kpi) {
                return [
                    'name' => $kpi->employee->user->name,
                    'score' => $kpi->score,
                    'period' => $kpi->period,
                ];
            });

            $settings = cache()->remember('company_settings_mapped', 86400, function () {
                $all = \App\Models\CompanySetting::all();
                $mappedData = [];
                foreach ($all as $setting) {
                    $mappedData[$setting->key] = $setting->value;
                }
                return $mappedData;
            });

            $headBranch = \App\Models\Branch::where('is_head_office', true)->where('is_active', true)->first();
            if ($headBranch) {
                $officeLat = (float) $headBranch->latitude;
                $officeLng = (float) $headBranch->longitude;
                $officeRadius = (int) $headBranch->radius_meters;
                $companyName = $headBranch->name;
            } else {
                $officeLat = (float) ($settings['office_latitude'] ?? -6.151595380868531);
                $officeLng = (float) ($settings['office_longitude'] ?? 106.77652147472021);
                $officeRadius = (int) ($settings['office_radius'] ?? 50);
                $companyName = $settings['company_name'] ?? 'Kantor Pusat';
            }

            $teamPulse = $this->getTeamPulseData($today);

        return response()->json([
            'success' => true,
            'data' => [
                'role' => $user->role,
                'total_employees' => $totalEmployees,
                'total_payroll_cost' => $totalPayrollCost,
                'pending_leaves' => $pendingLeavesAdmin,
                'pending_claims' => $pendingClaimsAdmin,
                'chart_data' => $chartData,
                'attendance_stats' => $attendanceStats,
                'department_dist' => $departmentDist,
                'top_kpi' => $topKPI,
                'announcements' => $announcements,
                'geofencing' => [
                    'latitude' => (float) $officeLat,
                    'longitude' => (float) $officeLng,
                    'radius' => (int) $officeRadius,
                    'company_name' => $companyName,
                ],
                'team_pulse' => $teamPulse,
            ]
        ]);
    }

    public function getApprovals(): JsonResponse
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        $employeeId = $user->employee ? $user->employee->id : null;
        $role = $user->role;

        $approvals = [];

        // 1. Leaves
        $leavesQuery = \App\Models\Leave::with('employee.user');
        if ($role === 'hr' || $role === 'admin') {
            $leavesQuery->where('status', 'pending_hr');
        } else {
            $leavesQuery->where('status', 'pending_manager')
                ->whereHas('employee', function($q) use ($employeeId) {
                    $q->where('manager_id', $employeeId);
                });
        }
        $leaves = $leavesQuery->get()->map(function($l) {
            return [
                'id' => $l->id,
                'type_label' => 'Cuti',
                'module' => 'leave',
                'employee_name' => $l->employee->user->name,
                'details' => $l->leave_type . ' (' . $l->start_date . ' s/d ' . $l->end_date . ')',
                'created_at' => $l->created_at->format('Y-m-d'),
                'status' => $l->status
            ];
        });
        $approvals = array_merge($approvals, $leaves->toArray());

        // 2. Overtimes
        $overtimeQuery = \App\Models\Overtime::with('employee.user');
        if ($role === 'hr' || $role === 'admin') {
            $overtimeQuery->where('status', 'pending_hr');
        } else {
            $overtimeQuery->where('status', 'pending_manager')
                ->whereHas('employee', function($q) use ($employeeId) {
                    $q->where('manager_id', $employeeId);
                });
        }
        $overtimes = $overtimeQuery->get()->map(function($o) {
            return [
                'id' => $o->id,
                'type_label' => 'Lembur',
                'module' => 'overtime',
                'employee_name' => $o->employee->user->name,
                'details' => $o->date . ' (' . $o->start_time . ' - ' . $o->end_time . ')',
                'created_at' => $o->created_at->format('Y-m-d'),
                'status' => $o->status
            ];
        });
        $approvals = array_merge($approvals, $overtimes->toArray());

        // 3. Reimbursements
        $reimbQuery = \App\Models\Reimbursement::with('employee.user');
        if ($role === 'hr' || $role === 'admin') {
            $reimbQuery->where('status', 'pending_hr');
        } else {
            $reimbQuery->where('status', 'pending_manager')
                ->whereHas('employee', function($q) use ($employeeId) {
                    $q->where('manager_id', $employeeId);
                });
        }
        $reimbursements = $reimbQuery->get()->map(function($r) {
            return [
                'id' => $r->id,
                'type_label' => 'Reimbursement',
                'module' => 'reimbursement',
                'employee_name' => $r->employee->user->name,
                'details' => $r->type . ' - Rp ' . number_format($r->amount, 0, ',', '.'),
                'created_at' => $r->created_at->format('Y-m-d'),
                'status' => $r->status
            ];
        });
        $approvals = array_merge($approvals, $reimbursements->toArray());

        // 4. Cash Advances
        $cashQuery = \App\Models\CashAdvance::with('employee.user');
        if ($role === 'hr' || $role === 'admin') {
            $cashQuery->where('status', 'pending_hr');
        } else {
            $cashQuery->where('status', 'pending_manager')
                ->whereHas('employee', function($q) use ($employeeId) {
                    $q->where('manager_id', $employeeId);
                });
        }
        $cashes = $cashQuery->get()->map(function($c) {
            return [
                'id' => $c->id,
                'type_label' => 'Kasbon',
                'module' => 'cash_advance',
                'employee_name' => $c->employee->user->name,
                'details' => 'Rp ' . number_format($c->amount, 0, ',', '.') . ' (' . $c->date . ')',
                'created_at' => $c->created_at->format('Y-m-d'),
                'status' => $c->status
            ];
        });
        $approvals = array_merge($approvals, $cashes->toArray());

        // Sort by created_at DESC
        usort($approvals, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        return response()->json([
            'success' => true,
            'data' => $approvals
        ]);
    }

    protected function getTeamPulseData($today): array
    {
        // 1. Who's on leave today
        $leavesToday = \App\Models\Leave::with('employee.user')
            ->where('status', 'approved')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->get()
            ->map(function ($l) {
                return [
                    'id' => $l->id,
                    'name' => $l->employee->user->name ?? 'Karyawan',
                    'department' => $l->employee->department_id ?? '-',
                    'avatar' => $l->employee->profile_photo ? asset('storage/' . $l->employee->profile_photo) : null,
                    'type' => $l->type ?? 'annual',
                    'status_label' => $l->type === 'sick' ? 'Izin Sakit' : ($l->type === 'annual' ? 'Cuti Tahunan' : 'Izin'),
                ];
            });

        // 2. Who's working from home today
        $wfhToday = \App\Models\Attendance::with('employee.user')
            ->where('date', $today)
            ->where('work_mode', 'wfh')
            ->get()
            ->map(function ($att) {
                return [
                    'id' => $att->id,
                    'name' => $att->employee->user->name ?? 'Karyawan',
                    'department' => $att->employee->department_id ?? '-',
                    'avatar' => $att->employee->profile_photo ? asset('storage/' . $att->employee->profile_photo) : null,
                    'clock_in' => $att->clock_in ? substr($att->clock_in, 0, 5) : '-',
                    'status_label' => 'WFH',
                ];
            });

        // 3. Birthdays in next 14 days
        $now = \Carbon\Carbon::now();
        $upcomingBirthdays = \App\Models\Employee::with('user')
            ->whereNotNull('birth_date')
            ->get()
            ->filter(function ($emp) use ($now) {
                if (!$emp->birth_date) return false;
                try {
                    $bday = \Carbon\Carbon::parse($emp->birth_date)->year($now->year);
                    if ($bday->isPast() && $bday->diffInDays($now) > 1) {
                        $bday->addYear();
                    }
                    $diff = (int) $now->diffInDays($bday, false);
                    return $diff >= 0 && $diff <= 14;
                } catch (\Exception $e) {
                    return false;
                }
            })
            ->map(function ($emp) use ($now) {
                $bday = \Carbon\Carbon::parse($emp->birth_date)->year($now->year);
                return [
                    'id' => $emp->id,
                    'name' => $emp->user->name ?? 'Karyawan',
                    'department' => $emp->department_id ?? '-',
                    'avatar' => $emp->profile_photo ? asset('storage/' . $emp->profile_photo) : null,
                    'date' => \Carbon\Carbon::parse($emp->birth_date)->format('d M'),
                    'days_left' => (int) $now->diffInDays($bday, false),
                ];
            })
            ->sortBy('days_left')
            ->values();

        // 4. Upcoming holidays
        $upcomingHolidays = \App\Models\Holiday::where('date', '>=', $today)
            ->orderBy('date', 'asc')
            ->limit(3)
            ->get()
            ->map(function ($h) {
                return [
                    'id' => $h->id,
                    'name' => $h->name,
                    'date' => \Carbon\Carbon::parse($h->date)->format('d M Y'),
                    'raw_date' => $h->date,
                ];
            });

        return [
            'leaves_today' => $leavesToday,
            'wfh_today' => $wfhToday,
            'upcoming_birthdays' => $upcomingBirthdays,
            'upcoming_holidays' => $upcomingHolidays,
        ];
    }
}
