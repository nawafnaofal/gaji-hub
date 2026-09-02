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
                $presentDays = $attendances->whereIn('status', ['present', 'late'])->count();
                $lateDays = $attendances->where('status', 'late')->count();
                $leaveDays = $attendances->where('status', 'leave')->count();
                $sickDays = $attendances->where('status', 'sick')->count();
                $permitDays = $attendances->where('status', 'permit')->count();

                // Get holidays in this month
                $holidaysCount = \App\Models\Holiday::whereMonth('date', $month)
                                ->whereYear('date', $year)
                                ->count();
                
                // Asumsi 22 hari kerja dalam sebulan, dikurangi hari libur nasional
                $workingDays = 22 - $holidaysCount;
                if ($workingDays < 1) $workingDays = 22; // fallback

                // Perhitungan Absen Mangkir (Tanpa Keterangan)
                $effectiveWorkingDays = $presentDays + $leaveDays + $sickDays + $permitDays + $holidaysCount;
                $absentCount = 0;
                if ($effectiveWorkingDays < $workingDays) {
                    $absentCount = $workingDays - $effectiveWorkingDays;
                }

                // Jika tidak ada data absen sama sekali, mari kita anggap hadir penuh untuk simulasi ini 
                // agar tidak menjadi 0 gajinya (karena HR mungkin belum input).
                if ($attendances->count() == 0) {
                    $presentDays = $workingDays; 
                    $lateDays = 0;
                    $leaveDays = 0;
                }

                $basicSalary = $emp->basic_salary;
                
                // Prorata calculation for new joiners
                $joinDate = $emp->join_date ? \Carbon\Carbon::parse($emp->join_date) : null;
                if ($joinDate && $joinDate->year == $year && $joinDate->month == $month) {
                    $daysInMonth = $joinDate->daysInMonth;
                    $remainingDays = $daysInMonth - $joinDate->day + 1;
                    $prorateRatio = $remainingDays / $daysInMonth;
                    $basicSalary = round($basicSalary * $prorateRatio);
                }
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
                $absenceDeduction = 0;
                if ($absentCount > 0) {
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

                // Ambil uang lembur (Overtime) - rate Depnaker = Gaji Pokok / 173
                $overtimes = Overtime::where('employee_id', $emp->id)
                    ->where('status', 'approved')
                    ->whereMonth('date', $month)
                    ->whereYear('date', $year)
                    ->sum('duration_hours');
                
                $overtimeRate = round($basicSalary / 173);
                $overtimePay = $overtimes * $overtimeRate;
                $totalAllowance += $overtimePay;

                // Tunjangan Kehadiran (Transportasi & Makan)
                $tunjanganTransport = 45000 * $presentDays;
                $tunjanganMakan = 45000 * $presentDays;
                $totalAllowance += ($tunjanganTransport + $tunjanganMakan);

                // Hitung BPJS Perusahaan (Benefit / Employer Portion)
                $bpjsTkJhtCompany = $basicSalary * 0.037; // 3.70%
                $bpjsTkJkkCompany = $basicSalary * 0.0024; // 0.24%
                $bpjsTkJkmCompany = $basicSalary * 0.0030; // 0.30%
                $bpjsTkJpCompany = $basicSalary * 0.02; // 2%
                $bpjsKesCompany = min($basicSalary, 12000000) * 0.04; // 4%

                // Hitung BPJS Karyawan (Deduction / Employee Portion)
                $bpjsTkJhtEmployee = $basicSalary * 0.02; // 2%
                $bpjsTkJpEmployee = $basicSalary * 0.01; // 1%
                $bpjsKesEmployee = min($basicSalary, 12000000) * 0.01; // 1%
                
                $totalDeduction += ($bpjsKesEmployee + $bpjsTkJhtEmployee + $bpjsTkJpEmployee);

                // Hitung PPh 21 (TER 2024)
                $bruto = $basicSalary + $totalAllowance;
                
                // Menentukan Kategori TER
                $taxStatus = $emp->tax_status ?? 'TK/0';
                $kategoriA = ['TK/0', 'TK/1', 'K/0'];
                $kategoriB = ['TK/2', 'TK/3', 'K/1', 'K/2'];
                $kategoriC = ['K/3'];
                
                $terRate = 0;
                
                if (in_array($taxStatus, $kategoriA)) {
                    if ($bruto <= 5400000) $terRate = 0;
                    elseif ($bruto <= 5650000) $terRate = 0.0025;
                    elseif ($bruto <= 5950000) $terRate = 0.005;
                    elseif ($bruto <= 6300000) $terRate = 0.0075;
                    elseif ($bruto <= 6750000) $terRate = 0.01;
                    elseif ($bruto <= 7500000) $terRate = 0.0125;
                    elseif ($bruto <= 8550000) $terRate = 0.015;
                    elseif ($bruto <= 9650000) $terRate = 0.0175;
                    elseif ($bruto <= 10050000) $terRate = 0.02;
                    else $terRate = 0.025; // Sederhana
                } elseif (in_array($taxStatus, $kategoriB)) {
                    if ($bruto <= 6200000) $terRate = 0;
                    elseif ($bruto <= 6500000) $terRate = 0.0025;
                    elseif ($bruto <= 6850000) $terRate = 0.005;
                    elseif ($bruto <= 7300000) $terRate = 0.0075;
                    elseif ($bruto <= 9200000) $terRate = 0.015;
                    elseif ($bruto <= 10050000) $terRate = 0.0175;
                    else $terRate = 0.02; // Sederhana
                } else {
                    // Kategori C (K/3)
                    if ($bruto <= 6600000) $terRate = 0;
                    elseif ($bruto <= 6950000) $terRate = 0.0025;
                    elseif ($bruto <= 7350000) $terRate = 0.005;
                    elseif ($bruto <= 7800000) $terRate = 0.0075;
                    elseif ($bruto <= 8850000) $terRate = 0.01;
                    elseif ($bruto <= 9800000) $terRate = 0.0125;
                    else $terRate = 0.015; // Sederhana
                }

                $pph21 = round($bruto * $terRate);
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
                        'attendance_summary' => [
                            'total_days' => $workingDays,
                            'present' => $presentDays,
                            'absent' => $absentCount,
                            'leave' => $leaveDays,
                            'sick' => $sickDays,
                            'permit' => $permitDays,
                        ],
                        'allowances' => [
                            'transport' => $tunjanganTransport,
                            'meal' => $tunjanganMakan,
                            'reimbursement' => $reimbursements,
                            'overtime' => $overtimePay,
                        ],
                        'benefits' => [
                            'bpjs_tk_jht' => $bpjsTkJhtCompany,
                            'bpjs_tk_jkk' => $bpjsTkJkkCompany,
                            'bpjs_tk_jkm' => $bpjsTkJkmCompany,
                            'bpjs_tk_jp' => $bpjsTkJpCompany,
                            'bpjs_kesehatan' => $bpjsKesCompany,
                        ],
                        'deductions' => [
                            'absence_penalty' => $absenceDeduction,
                            'late_penalty' => $lateDeduction,
                            'bpjs_kesehatan' => $bpjsKesEmployee,
                            'bpjs_tk_jht' => $bpjsTkJhtEmployee,
                            'bpjs_tk_jp' => $bpjsTkJpEmployee,
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

        try {
            \Illuminate\Support\Facades\Mail::to($payroll->employee->user->email)->send(new \App\Mail\PayrollSlipMail($payroll));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to send payroll email: " . $e->getMessage());
        }

        return response()->json(['success' => true, 'message' => 'Dana berhasil dicairkan ke karyawan.', 'data' => $payroll]);
    }
}
