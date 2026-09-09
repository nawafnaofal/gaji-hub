<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Leave;
use App\Models\Payroll;
use App\Models\Overtime;
use App\Models\PerformanceReview;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Rekap Absensi Bulanan
     */
    public function attendance(Request $request)
    {
        $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer',
        ]);

        $employees = Employee::with('user')->where('employment_status', '!=', 'terminated')
            ->orWhereNull('employment_status')->get();

        $report = $employees->map(function ($emp) use ($request) {
            $attendances = Attendance::where('employee_id', $emp->id)
                ->whereMonth('date', $request->month)
                ->whereYear('date', $request->year)
                ->get();

            return [
                'employee_code' => $emp->employee_code,
                'name' => $emp->user?->name,
                'position' => $emp->position ?? $emp->job_title,
                'department' => $emp->department,
                'present' => $attendances->where('status', 'present')->count(),
                'late' => $attendances->where('status', 'late')->count(),
                'absent' => $attendances->where('status', 'absent')->count(),
                'total_days' => $attendances->count(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $report,
            'period' => $request->month . '/' . $request->year,
        ]);
    }

    /**
     * Laporan Penggajian Bulanan
     */
    public function payroll(Request $request)
    {
        $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer',
        ]);

        $payrolls = Payroll::with('employee.user')
            ->where('period_month', $request->month)
            ->where('period_year', $request->year)
            ->get();

        $mappedPayrolls = $payrolls->map(function ($p) {
            $details = is_array($p->details) ? $p->details : (json_decode($p->details, true) ?? []);
            $bpjsKes = $details['deductions']['bpjs_kesehatan'] ?? 0;
            $bpjsTk = ($details['deductions']['bpjs_tk_jht'] ?? 0) + ($details['deductions']['bpjs_tk_jp'] ?? 0);
            $pph21 = $details['deductions']['pph21'] ?? 0;

            return [
                'id' => $p->id,
                'employee' => $p->employee,
                'basic_salary' => (float) ($p->total_basic ?? 0),
                'total_allowances' => (float) ($p->total_allowance ?? 0),
                'total_deductions' => (float) ($p->total_deduction ?? 0),
                'bpjs_kesehatan_employee' => (float) $bpjsKes,
                'bpjs_ketenagakerjaan_employee' => (float) $bpjsTk,
                'pph21' => (float) $pph21,
                'net_salary' => (float) ($p->net_salary ?? 0),
                'status' => $p->status,
            ];
        });

        $summary = [
            'total_employees' => $mappedPayrolls->count(),
            'total_basic_salary' => $mappedPayrolls->sum('basic_salary'),
            'total_allowances' => $mappedPayrolls->sum('total_allowances'),
            'total_deductions' => $mappedPayrolls->sum('total_deductions'),
            'total_net_salary' => $mappedPayrolls->sum('net_salary'),
            'total_bpjs' => $mappedPayrolls->sum('bpjs_kesehatan_employee') + $mappedPayrolls->sum('bpjs_ketenagakerjaan_employee'),
            'total_pph21' => $mappedPayrolls->sum('pph21'),
        ];

        return response()->json([
            'success' => true,
            'data' => $mappedPayrolls,
            'summary' => $summary,
            'period' => $request->month . '/' . $request->year,
        ]);
    }

    /**
     * Laporan Cuti & Saldo Cuti
     */
    public function leave(Request $request)
    {
        $request->validate([
            'year' => 'required|integer',
        ]);

        $employees = Employee::with('user')
            ->where('employment_status', '!=', 'terminated')
            ->orWhereNull('employment_status')
            ->get();

        $report = $employees->map(function ($emp) use ($request) {
            $leaves = Leave::where('employee_id', $emp->id)
                ->whereYear('start_date', $request->year)
                ->where('status', 'approved')
                ->get();

            $usedDays = $leaves->sum(function ($leave) {
                return \Carbon\Carbon::parse($leave->start_date)
                    ->diffInDays(\Carbon\Carbon::parse($leave->end_date)) + 1;
            });

            return [
                'employee_code' => $emp->employee_code,
                'name' => $emp->user?->name,
                'department' => $emp->department,
                'quota' => $emp->annual_leave_quota ?? 12,
                'used' => $usedDays,
                'remaining' => max(0, ($emp->annual_leave_quota ?? 12) - $usedDays),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $report,
            'year' => $request->year,
        ]);
    }

    /**
     * Laporan Lembur Bulanan
     */
    public function overtime(Request $request)
    {
        $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer',
        ]);

        $overtimes = Overtime::with('employee.user')
            ->whereMonth('date', $request->month)
            ->whereYear('date', $request->year)
            ->where('status', 'approved')
            ->get();

        $mappedOvertimes = $overtimes->map(function ($ot) {
            return [
                'id' => $ot->id,
                'date' => $ot->date,
                'employee' => $ot->employee,
                'duration_hours' => (float) $ot->duration_hours,
                'hours' => (float) $ot->duration_hours,
                'reason' => $ot->reason,
                'status' => $ot->status,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $mappedOvertimes,
            'total_hours' => (float) $overtimes->sum('duration_hours'),
            'period' => $request->month . '/' . $request->year,
        ]);
    }

    /**
     * Laporan KPI / Kinerja
     */
    public function kpi(Request $request)
    {
        $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer',
        ]);

        $reviews = PerformanceReview::with(['employee.user', 'reviewer'])
            ->where('period_month', $request->month)
            ->where('period_year', $request->year)
            ->orderBy('score', 'desc')
            ->get();

        $summary = [
            'total_reviewed' => $reviews->count(),
            'average_score' => round($reviews->avg('score'), 1),
            'highest_score' => $reviews->max('score'),
            'lowest_score' => $reviews->min('score'),
        ];

        return response()->json([
            'success' => true,
            'data' => $reviews,
            'summary' => $summary,
            'period' => $request->month . '/' . $request->year,
        ]);
    }
}
