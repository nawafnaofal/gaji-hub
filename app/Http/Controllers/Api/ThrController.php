<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Thr;
use App\Models\Employee;
use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class ThrController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $year = (int) ($request->input('year') ?: Carbon::now()->year);
        $holiday = $request->input('religious_holiday', 'idul_fitri');

        $query = Thr::with(['employee.user'])
            ->where('period_year', $year)
            ->where('religious_holiday', $holiday);

        if ($user->role === 'employee') {
            $employeeId = $user->employee ? $user->employee->id : 0;
            $query->where('employee_id', $employeeId);
        }

        $thrs = $query->orderBy('thr_amount', 'desc')->get();

        $summary = [
            'total_employees' => $thrs->count(),
            'total_payout' => (float) $thrs->sum('thr_amount'),
            'total_net' => (float) $thrs->sum('net_amount'),
            'draft_count' => $thrs->where('status', 'draft')->count(),
            'approved_count' => $thrs->where('status', 'approved')->count(),
            'paid_count' => $thrs->where('status', 'paid')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $thrs,
            'summary' => $summary,
            'year' => $year,
            'religious_holiday' => $holiday,
        ]);
    }

    public function preview(Request $request): JsonResponse
    {
        $year = (int) ($request->input('year') ?: Carbon::now()->year);
        $holiday = $request->input('religious_holiday', 'idul_fitri');
        $cutoffDate = $request->input('cutoff_date') ? Carbon::parse($request->cutoff_date)->startOfDay() : Carbon::now()->startOfDay();

        $employees = Employee::with('user')
            ->where('employment_status', '!=', 'inactive')
            ->get();

        $calculations = [];

        foreach ($employees as $emp) {
            $joinDate = $emp->join_date ? Carbon::parse($emp->join_date)->startOfDay() : $cutoffDate;
            $serviceMonths = (int) $joinDate->diffInMonths($cutoffDate);

            $basicSalary = (float) $emp->basic_salary;
            $fixedAllowance = 0; // can be extended with fixed allowances
            $baseForThr = $basicSalary + $fixedAllowance;

            if ($serviceMonths >= 12) {
                // 1 Month Salary
                $thrAmount = $baseForThr;
                $rule = 'Masa Kerja >= 12 Bulan (1x Gaji Pokok)';
            } elseif ($serviceMonths >= 1) {
                // Prorata Permenaker 6/2016: (serviceMonths / 12) * Base
                $thrAmount = round(($serviceMonths / 12) * $baseForThr, 0);
                $rule = 'Prorata ' . $serviceMonths . '/12 Bulan';
            } else {
                $thrAmount = 0;
                $rule = 'Masa Kerja < 1 Bulan (Tidak Berhak)';
            }

            // Estimate PPh 21 (0 for basic preview or small threshold)
            $pph21 = 0;
            $netAmount = max(0, $thrAmount - $pph21);

            $calculations[] = [
                'employee_id' => $emp->id,
                'employee_code' => $emp->employee_code,
                'name' => $emp->user->name ?? 'Karyawan',
                'department' => $emp->department_id ?? '-',
                'join_date' => $emp->join_date,
                'service_months' => $serviceMonths,
                'rule_applied' => $rule,
                'basic_salary' => $basicSalary,
                'fixed_allowance' => $fixedAllowance,
                'thr_amount' => $thrAmount,
                'tax_pph21' => $pph21,
                'net_amount' => $netAmount,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $calculations,
            'total_estimated' => array_sum(array_column($calculations, 'thr_amount')),
            'year' => $year,
            'cutoff_date' => $cutoffDate->format('Y-m-d'),
        ]);
    }

    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'year' => 'required|integer',
            'religious_holiday' => 'required|string',
        ]);

        $year = (int) $request->year;
        $holiday = $request->religious_holiday;
        $cutoffDate = $request->cutoff_date ? Carbon::parse($request->cutoff_date)->startOfDay() : Carbon::now()->startOfDay();

        $employees = Employee::where('employment_status', '!=', 'inactive')->get();

        DB::beginTransaction();
        try {
            $createdCount = 0;
            foreach ($employees as $emp) {
                $joinDate = $emp->join_date ? Carbon::parse($emp->join_date)->startOfDay() : $cutoffDate;
                $serviceMonths = (int) $joinDate->diffInMonths($cutoffDate);

                $baseForThr = (float) $emp->basic_salary;

                if ($serviceMonths >= 12) {
                    $thrAmount = $baseForThr;
                } elseif ($serviceMonths >= 1) {
                    $thrAmount = round(($serviceMonths / 12) * $baseForThr, 0);
                } else {
                    $thrAmount = 0;
                }

                $pph21 = 0;
                $netAmount = max(0, $thrAmount - $pph21);

                Thr::updateOrCreate(
                    [
                        'employee_id' => $emp->id,
                        'period_year' => $year,
                        'religious_holiday' => $holiday,
                    ],
                    [
                        'service_months' => $serviceMonths,
                        'basic_salary' => $emp->basic_salary,
                        'fixed_allowance' => 0,
                        'thr_amount' => $thrAmount,
                        'tax_pph21' => $pph21,
                        'net_amount' => $netAmount,
                        'status' => 'draft',
                        'notes' => 'Kalkulasi Otomatis Permenaker No. 6/2016',
                    ]
                );
                $createdCount++;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Berhasil memproses kalkulasi THR {$holiday} tahun {$year} untuk {$createdCount} karyawan.",
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal generate THR: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function approve(Request $request, $id): JsonResponse
    {
        $thr = Thr::findOrFail($id);
        $thr->update(['status' => 'approved']);

        return response()->json(['success' => true, 'message' => 'THR berhasil disetujui.']);
    }

    public function bulkApprove(Request $request): JsonResponse
    {
        $year = $request->input('year');
        $holiday = $request->input('religious_holiday');

        Thr::where('period_year', $year)
            ->where('religious_holiday', $holiday)
            ->where('status', 'draft')
            ->update(['status' => 'approved']);

        return response()->json(['success' => true, 'message' => 'Seluruh draft THR berhasil disetujui.']);
    }

    public function disburse(Request $request, $id): JsonResponse
    {
        $thr = Thr::findOrFail($id);
        $thr->update([
            'status' => 'paid',
            'payment_date' => Carbon::now()->format('Y-m-d'),
        ]);

        return response()->json(['success' => true, 'message' => 'THR berhasil dicairkan (Paid).']);
    }

    public function bulkDisburse(Request $request): JsonResponse
    {
        $year = $request->input('year');
        $holiday = $request->input('religious_holiday');

        Thr::where('period_year', $year)
            ->where('religious_holiday', $holiday)
            ->where('status', 'approved')
            ->update([
                'status' => 'paid',
                'payment_date' => Carbon::now()->format('Y-m-d'),
            ]);

        return response()->json(['success' => true, 'message' => 'Seluruh THR yang disetujui telah dicairkan (Paid).']);
    }

    public function exportBankTransfer(Request $request)
    {
        $year = (int) ($request->input('year') ?: Carbon::now()->year);
        $holiday = $request->input('religious_holiday', 'idul_fitri');

        $thrs = Thr::with('employee.user')
            ->where('period_year', $year)
            ->where('religious_holiday', $holiday)
            ->whereIn('status', ['approved', 'paid'])
            ->get();

        $csvFileName = "transfer_thr_{$holiday}_{$year}.csv";
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$csvFileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['No Rekening', 'Nama Penerima', 'Bank', 'Nominal Transfer', 'Keterangan'];

        $callback = function() use ($thrs, $columns, $holiday, $year) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($thrs as $t) {
                $bankAccount = $t->employee->bank_account_number ?? '-';
                $bankName = $t->employee->bank_name ?? 'BCA';
                $name = $t->employee->user->name ?? 'Karyawan';
                $amount = (int) $t->net_amount;
                $desc = "THR " . ucfirst(str_replace('_', ' ', $holiday)) . " " . $year;

                fputcsv($file, [$bankAccount, $name, $bankName, $amount, $desc]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function downloadSlipPdf($id)
    {
        $thr = Thr::with('employee.user')->findOrFail($id);
        $user = Auth::user();

        if ($user->role === 'employee' && $thr->employee_id !== $user->employee?->id) {
            abort(403, 'Akses ditolak.');
        }

        $settings = CompanySetting::pluck('value', 'key')->toArray();

        $pdf = Pdf::loadView('pdf.slip_thr', compact('thr', 'settings'));
        $filename = "Slip_THR_{$thr->period_year}_{$thr->employee->user->name}.pdf";

        return $pdf->download($filename);
    }
}
