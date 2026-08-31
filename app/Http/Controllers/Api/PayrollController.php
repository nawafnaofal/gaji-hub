<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payroll;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

use Illuminate\Support\Facades\DB;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\SalaryComponent;
use App\Models\Overtime;
use App\Models\CompanySetting;
use Illuminate\Support\Facades\Auth;

class PayrollController extends Controller
{
    public function generate(Request $request)
    {
        $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer'
        ]);

        $month = $request->month;
        $year = $request->year;

        DB::beginTransaction();
        try {
            // Check if there are already approved or paid payrolls for this month
            $existingApproved = Payroll::where('period_month', $month)
                ->where('period_year', $year)
                ->whereIn('status', ['approved', 'paid'])
                ->exists();

            if ($existingApproved) {
                return response()->json(['success' => false, 'message' => 'Gaji untuk periode ini sudah disetujui atau dibayarkan. Tidak bisa digenerate ulang.'], 400);
            }

            // Delete existing DRAFT payroll for the same period to avoid duplicates
            Payroll::where('period_month', $month)->where('period_year', $year)->where('status', 'draft')->delete();

            $employees = Employee::all();

            // Ambil semua komponen dari master yang global (jika ada) - kita asumsikan untuk sekarang 
            // ambil dari relasi employee_salary_components atau ambil semua komponen default
            $masterComponents = SalaryComponent::all();
            
            $settings = CompanySetting::all()->pluck('value', 'key')->toArray();
            $latePenaltySetting = floatval($settings['late_penalty'] ?? 50000);
            $absencePenaltySetting = floatval($settings['absence_penalty'] ?? 0);
            $bpjsKesehatanRate = floatval($settings['bpjs_kesehatan_rate'] ?? 1) / 100;
            $bpjsKetenagakerjaanRate = floatval($settings['bpjs_ketenagakerjaan_rate'] ?? 3) / 100;
            
            $generatedCount = 0;
            foreach ($employees as $emp) {
                // Hitung absen (simulasi: asumsi jika tidak ada data absen maka potong gaji)
                // Ini logic standar perusahaan: hitung jumlah kehadiran.
                $attendances = Attendance::where('employee_id', $emp->id)
                                ->whereMonth('date', $month)
                                ->whereYear('date', $year)
                                ->get();
                
                // Get holidays in this month
                $holidaysCount = \App\Models\Holiday::whereMonth('date', $month)
                                ->whereYear('date', $year)
                                ->count();
                
                $presentDays = $attendances->whereIn('status', ['present', 'late'])->count();
                $lateDays = $attendances->where('status', 'late')->count();
                $leaveDays = $attendances->where('status', 'leave')->count();
                
                // Asumsi 22 hari kerja dalam sebulan, dikurangi hari libur nasional
                $workingDays = max(0, 22 - $holidaysCount);

                // Jika tidak ada data absen sama sekali, mari kita anggap hadir penuh untuk simulasi ini 
                // agar tidak menjadi 0 gajinya (karena HR mungkin belum input).
                if ($attendances->count() == 0) {
                    $presentDays = $workingDays; 
                    $lateDays = 0;
                    $leaveDays = 0;
                }

                $basicSalary = $emp->basic_salary;
                $totalAllowance = 0;
                $totalDeduction = 0;

                // Tambahkan dari Master Komponen default (misal BPJS)
                foreach ($masterComponents as $comp) {
                    if ($comp->type === 'allowance') {
                        $totalAllowance += $comp->default_amount;
                    } else {
                        $totalDeduction += $comp->default_amount;
                    }
                }

                // Kalkulasi potongan absen
                $effectiveWorkingDays = $presentDays + $leaveDays;
                if ($effectiveWorkingDays < $workingDays) {
                    $absentCount = $workingDays - $effectiveWorkingDays;
                    // Jika ada absence_penalty disetting (non-0), gunakan itu. Jika tidak, gunakan Prorata.
                    if ($absencePenaltySetting > 0) {
                        $absenceDeduction = $absentCount * $absencePenaltySetting;
                    } else {
                        $absenceDeduction = $absentCount * ($basicSalary / $workingDays);
                    }
                    $totalDeduction += $absenceDeduction;
                }

                // Denda keterlambatan
                $lateDeduction = 0;
                if ($lateDays > 0) {
                    $lateDeduction = ($lateDays * $latePenaltySetting);
                    $totalDeduction += $lateDeduction;
                }

                // Ambil reimbursement yang disetujui bulan ini
                $reimbursements = \App\Models\Reimbursement::where('employee_id', $emp->id)
                    ->where('status', 'approved')
                    ->whereMonth('date', $month)
                    ->whereYear('date', $year)
                    ->sum('amount');
                
                $totalAllowance += $reimbursements;

                // Ambil uang lembur (Overtime) - misal rate Rp 25.000 / jam
                $overtimes = Overtime::where('employee_id', $emp->id)
                    ->where('status', 'approved')
                    ->whereMonth('date', $month)
                    ->whereYear('date', $year)
                    ->sum('duration_hours');
                
                $overtimePay = $overtimes * 25000;
                $totalAllowance += $overtimePay;

                // Hitung BPJS berdasarkan setting
                $bpjsKesehatan = min($basicSalary, 12000000) * $bpjsKesehatanRate;
                $bpjsTenagakerja = min($basicSalary, 10000000) * $bpjsKetenagakerjaanRate;
                $totalDeduction += ($bpjsKesehatan + $bpjsTenagakerja);

                // Hitung PPh 21 (Sederhana berdasarkan PTKP bulanan)
                $bruto = $basicSalary + $totalAllowance;
                // Asumsi Biaya Jabatan 5% (Maks 500.000)
                $biayaJabatan = min($bruto * 0.05, 500000);
                
                // PTKP mapping (bulanan)
                $ptkpMap = [
                    'TK/0' => 4500000,
                    'TK/1' => 4875000,
                    'TK/2' => 5250000,
                    'TK/3' => 5625000,
                    'K/0'  => 4875000,
                    'K/1'  => 5250000,
                    'K/2'  => 5625000,
                    'K/3'  => 6000000,
                ];
                $taxStatus = $emp->tax_status ?? 'TK/0';
                $ptkp = $ptkpMap[$taxStatus] ?? 4500000;

                $neto = $bruto - $biayaJabatan - $bpjsKesehatan - $bpjsTenagakerja;
                $pkp = $neto - $ptkp;
                
                $pph21 = 0;
                if ($pkp > 0) {
                    // PPh 21 tarif pasal 17 layer 1 sederhana (5%)
                    $pph21 = $pkp * 0.05;
                }
                $totalDeduction += $pph21;

                // Kasbon (Pinjaman Karyawan)
                $cashAdvances = \App\Models\CashAdvance::where('employee_id', $emp->id)
                    ->where('status', 'approved')
                    ->whereMonth('date', $month)
                    ->whereYear('date', $year)
                    ->get();
                
                $cashAdvanceTotal = $cashAdvances->sum('amount');
                $totalDeduction += $cashAdvanceTotal;
                
                // Ubah status kasbon menjadi paid karena sudah dipotong gaji
                foreach ($cashAdvances as $ca) {
                    $ca->update(['status' => 'paid']);
                }

                // Cicilan Pinjaman (Loan)
                $activeLoans = \App\Models\Loan::where('employee_id', $emp->id)
                    ->where('status', 'approved')
                    ->where('remaining_amount', '>', 0)
                    ->get();
                
                $loanInstallmentTotal = 0;
                foreach ($activeLoans as $loan) {
                    $installment = min($loan->monthly_installment, $loan->remaining_amount);
                    $loanInstallmentTotal += $installment;
                    $loan->update([
                        'remaining_amount' => $loan->remaining_amount - $installment,
                        'status' => ($loan->remaining_amount - $installment <= 0) ? 'paid_off' : 'approved'
                    ]);
                }
                $totalDeduction += $loanInstallmentTotal;

                $netSalary = $basicSalary + $totalAllowance - $totalDeduction;

                Payroll::create([
                    'employee_id' => $emp->id,
                    'period_month' => $month,
                    'period_year' => $year,
                    'total_basic' => $basicSalary,
                    'total_allowance' => $totalAllowance,
                    'total_deduction' => $totalDeduction,
                    'net_salary' => $netSalary,
                    'status' => 'draft',
                    'details' => json_encode([
                        'allowances' => [
                            'reimbursement' => $reimbursements,
                            'overtime' => $overtimePay,
                        ],
                        'deductions' => [
                            'absence_penalty' => $absenceDeduction,
                            'late_penalty' => $lateDeduction,
                            'bpjs_kesehatan' => $bpjsKesehatan,
                            'bpjs_ketenagakerjaan' => $bpjsTenagakerja,
                            'pph21' => $pph21,
                            'cash_advance' => $cashAdvanceTotal,
                            'loan_installment' => $loanInstallmentTotal
                        ]
                    ])
                ]);

                $generatedCount++;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Payroll berhasil di-generate untuk {$generatedCount} karyawan."
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function index(Request $request): JsonResponse
    {
        // 1. Ambil parameter pencarian & filter dari client
        $search = $request->query('search');
        $month = $request->query('month');
        $year = $request->query('year');

        // 2. Query Builder dengan Eager Loading
        $query = Payroll::with(['employee.user'])
            ->when($search, function ($q) use ($search) {
                $q->whereHas('employee', function ($employeeQuery) use ($search) {
                    $employeeQuery->where('employee_code', 'like', "%{$search}%")
                                  ->orWhereHas('user', function ($userQuery) use ($search) {
                                      $userQuery->where('name', 'like', "%{$search}%");
                                  });
                });
            })
            ->when($month, fn($q) => $q->where('period_month', $month))
            ->when($year, fn($q) => $q->where('period_year', $year))
            ->orderBy('created_at', 'desc');

        // 3. Server-side Pagination (misal 15 data per halaman)
        $payrolls = $query->paginate(15);

        // 4. Return Standardized JSON Response
        return response()->json([
            'success' => true,
            'message' => 'Data payroll berhasil diambil.',
            'data'    => $payrolls
        ]);
    }

    public function show($id)
    {
        $payroll = Payroll::with(['employee.user'])->findOrFail($id);
        
        // Authorization Check
        $user = Auth::user();
        if ($user->role === 'employee' && $payroll->employee_id !== $user->employee->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized access to this payroll'], 403);
        }
        
        return response()->json([
            'success' => true,
            'data' => $payroll
        ]);
    }

    public function downloadSlip($id)
    {
        $payroll = Payroll::with(['employee.user'])->findOrFail($id);
        
        // Authorization Check
        $user = Auth::user();
        if ($user->role === 'employee' && $payroll->employee_id !== $user->employee->id) {
            abort(403, 'Unauthorized access to this payroll slip');
        }
        
        $settings = \App\Models\CompanySetting::pluck('value', 'key')->toArray();
        
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('slip', compact('payroll', 'settings'));
        
        return $pdf->download("Slip_Gaji_{$payroll->employee->user->name}_{$payroll->period_month}_{$payroll->period_year}.pdf");
    }
    
    public function exportCsv()
    {
        $payrolls = Payroll::with('employee.user')->orderBy('period_year', 'desc')->orderBy('period_month', 'desc')->get();
        
        $fileName = 'payroll_report_' . date('Y_m_d_H_i_s') . '.csv';
        
        $headers = array(
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        );
        
        $columns = array('Bulan', 'Tahun', 'ID Karyawan', 'Nama', 'Departemen', 'Gaji Pokok', 'Tunjangan', 'Potongan', 'Gaji Bersih', 'Status');
        
        $callback = function() use($payrolls, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            
            foreach ($payrolls as $payroll) {
                $row['Bulan']  = $payroll->period_month;
                $row['Tahun']    = $payroll->period_year;
                $row['ID Karyawan']    = $payroll->employee->employee_code;
                $row['Nama']  = $payroll->employee->user->name;
                $row['Departemen']  = $payroll->employee->department_id;
                $row['Gaji Pokok']  = $payroll->total_basic;
                $row['Tunjangan']  = $payroll->total_allowance;
                $row['Potongan']  = $payroll->total_deduction;
                $row['Gaji Bersih']  = $payroll->net_salary;
                $row['Status']  = $payroll->status;

                fputcsv($file, array($row['Bulan'], $row['Tahun'], $row['ID Karyawan'], $row['Nama'], $row['Departemen'], $row['Gaji Pokok'], $row['Tunjangan'], $row['Potongan'], $row['Gaji Bersih'], $row['Status']));
            }
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }

    public function approve($id)
    {
        $payroll = Payroll::findOrFail($id);
        
        if ($payroll->status !== 'draft') {
            return response()->json(['success' => false, 'message' => 'Payroll cannot be approved from this status.'], 400);
        }
        
        $payroll->update([
            'status' => 'approved',
        ]);

        return response()->json(['success' => true, 'message' => 'Payroll berhasil disetujui (Approved).', 'data' => $payroll]);
    }

    public function disburse($id)
    {
        $payroll = Payroll::findOrFail($id);
        
        if ($payroll->status === 'paid') {
            return response()->json(['success' => false, 'message' => 'Payroll is already paid.'], 400);
        }

        // Mock API Disbursement (e.g. Xendit, Midtrans)
        // Simulate an API call...
        
        $payroll->update([
            'status' => 'paid',
            // Ideally record a transaction ID here
        ]);

        $this->notifyEmployee($payroll->employee, 'Gaji Dicairkan', 'Gaji bulan ' . $payroll->period_month . '/' . $payroll->period_year . ' telah ditransfer ke rekening Anda.', '/payroll', 'success');

        return response()->json(['success' => true, 'message' => 'Dana berhasil dicairkan ke karyawan.', 'data' => $payroll]);
    }
}
