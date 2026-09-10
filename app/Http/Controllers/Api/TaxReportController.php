<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\Thr;
use App\Models\CompanySetting;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class TaxReportController extends Controller
{
    /**
     * List all employees with their annual tax 1721-A1 summary for a given tax year.
     */
    public function index(Request $request): JsonResponse
    {
        $year = (int) ($request->query('year') ?: Carbon::now()->year);

        $employees = Employee::with('user')
            ->where('employment_status', '!=', 'inactive')
            ->orderBy('id', 'asc')
            ->get();

        $reports = [];
        $totalGross = 0;
        $totalTaxPayable = 0;
        $totalTaxWithheld = 0;

        foreach ($employees as $emp) {
            $taxData = $this->calculate1721A1($emp, $year);
            $reports[] = [
                'employee' => [
                    'id' => $emp->id,
                    'name' => $emp->user->name ?? 'Karyawan',
                    'employee_code' => $emp->employee_code,
                    'job_title' => $emp->job_title ?? $emp->position ?? 'Staff',
                    'department' => $emp->department_id ?? '-',
                    'npwp_number' => $emp->npwp_number ?: '00.000.000.0-000.000',
                    'tax_status' => $emp->tax_status ?: 'TK/0',
                ],
                'period_months' => $taxData['period_months_string'],
                'gross_income' => $taxData['gross_income'],
                'net_income' => $taxData['net_income'],
                'ptkp' => $taxData['ptkp'],
                'pkp' => $taxData['pkp'],
                'tax_payable' => $taxData['tax_payable'],
                'tax_withheld' => $taxData['tax_withheld'],
                'tax_difference' => $taxData['tax_difference'],
                'status_label' => $taxData['tax_difference'] == 0 ? 'NIHIL' : ($taxData['tax_difference'] > 0 ? 'KURANG BAYAR' : 'LEBIH BAYAR'),
            ];

            $totalGross += $taxData['gross_income'];
            $totalTaxPayable += $taxData['tax_payable'];
            $totalTaxWithheld += $taxData['tax_withheld'];
        }

        return response()->json([
            'success' => true,
            'year' => $year,
            'data' => $reports,
            'summary' => [
                'total_employees' => count($reports),
                'total_gross' => $totalGross,
                'total_tax_payable' => $totalTaxPayable,
                'total_tax_withheld' => $totalTaxWithheld,
            ],
        ]);
    }

    /**
     * Preview single employee 1721-A1 detailed points.
     */
    public function preview(Request $request, Employee $employee): JsonResponse
    {
        $year = (int) ($request->query('year') ?: Carbon::now()->year);
        $taxData = $this->calculate1721A1($employee, $year);

        return response()->json([
            'success' => true,
            'data' => $taxData,
        ]);
    }

    /**
     * Download official DJP 1721-A1 PDF for HR / Admin.
     */
    public function downloadPdf(Request $request, Employee $employee): Response
    {
        $year = (int) ($request->query('year') ?: Carbon::now()->year);
        return $this->generatePdfResponse($employee, $year);
    }

    /**
     * Employee Self-Service: Get own 1721-A1 data.
     */
    public function myTaxReport(Request $request): JsonResponse
    {
        $user = Auth::user();
        $employee = $user->employee;
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Bukan akun karyawan.'], 403);
        }

        $year = (int) ($request->query('year') ?: Carbon::now()->year);
        $taxData = $this->calculate1721A1($employee, $year);

        return response()->json([
            'success' => true,
            'data' => $taxData,
        ]);
    }

    /**
     * Employee Self-Service: Download own 1721-A1 PDF.
     */
    public function myTaxReportPdf(Request $request): Response
    {
        $user = Auth::user();
        $employee = $user->employee;
        if (!$employee) {
            abort(403, 'Bukan akun karyawan.');
        }

        $year = (int) ($request->query('year') ?: Carbon::now()->year);
        return $this->generatePdfResponse($employee, $year);
    }

    /**
     * Helper to generate DomPDF Response for Form 1721-A1.
     */
    protected function generatePdfResponse(Employee $employee, int $year): Response
    {
        $taxData = $this->calculate1721A1($employee, $year);
        $settings = CompanySetting::pluck('value', 'key')->toArray();

        $pdf = Pdf::loadView('pdf.form_1721_a1', compact('taxData', 'settings'))
            ->setPaper('a4', 'portrait');

        $empName = str_replace(' ', '_', $employee->user->name ?? 'Karyawan');
        $fileName = "Formulir_1721_A1_{$year}_{$empName}.pdf";

        return $pdf->download($fileName);
    }

    /**
     * Core Tax Calculation Engine for Form 1721-A1 according to PER-16/PJ/2016 & UU HPP.
     */
    public function calculate1721A1(Employee $employee, int $year): array
    {
        // 1. Determine working months in tax year
        $joinDate = $employee->join_date ? Carbon::parse($employee->join_date) : Carbon::create($year, 1, 1);
        $resignDate = $employee->resign_date ? Carbon::parse($employee->resign_date) : null;

        $startMonth = ($joinDate->year == $year) ? (int)$joinDate->month : 1;
        $endMonth = ($resignDate && $resignDate->year == $year) ? (int)$resignDate->month : 12;

        if ($startMonth > 12) $startMonth = 12;
        if ($endMonth < $startMonth) $endMonth = $startMonth;

        $serviceMonths = max(1, $endMonth - $startMonth + 1);

        // 2. Fetch payroll records in this tax year
        $payrolls = Payroll::where('employee_id', $employee->id)
            ->where('period_year', $year)
            ->whereIn('status', ['approved', 'paid'])
            ->get();

        // 3. Gross components accumulation
        $gajiPokok = 0;
        $tunjanganLain = 0;
        $premiAsuransi = 0;
        $iuranPensiunJht = 0;
        $pph21Withheld = 0;

        if ($payrolls->count() > 0) {
            foreach ($payrolls as $p) {
                $gajiPokok += (float) $p->total_basic;
                $details = is_string($p->details) ? json_decode($p->details, true) : $p->details;

                // Tunjangan
                if (isset($details['allowances'])) {
                    $tunjanganLain += (float) ($details['allowances']['transport'] ?? 0);
                    $tunjanganLain += (float) ($details['allowances']['meal'] ?? 0);
                    $tunjanganLain += (float) ($details['allowances']['overtime'] ?? 0);
                }

                // Premi dibayar pemberi kerja (JKK, JKM, BPJS Kes)
                if (isset($details['benefits'])) {
                    $premiAsuransi += (float) ($details['benefits']['bpjs_tk_jkk'] ?? 0);
                    $premiAsuransi += (float) ($details['benefits']['bpjs_tk_jkm'] ?? 0);
                    $premiAsuransi += (float) ($details['benefits']['bpjs_kesehatan'] ?? 0);
                }

                // Iuran dibayar pegawai (JHT 2% + JP 1%)
                if (isset($details['deductions'])) {
                    $iuranPensiunJht += (float) ($details['deductions']['bpjs_tk_jht'] ?? 0);
                    $iuranPensiunJht += (float) ($details['deductions']['bpjs_tk_jp'] ?? 0);
                    $pph21Withheld += (float) ($details['deductions']['pph21'] ?? 0);
                }
            }
        } else {
            // Simulated baseline if no generated payrolls yet
            $monthlyBasic = (float) $employee->basic_salary;
            $gajiPokok = $monthlyBasic * $serviceMonths;
            $tunjanganLain = (45000 * 22 * 2) * $serviceMonths; // meal + transport
            $premiAsuransi = ($monthlyBasic * 0.0024 + $monthlyBasic * 0.0030 + min($monthlyBasic, 12000000) * 0.04) * $serviceMonths;
            $iuranPensiunJht = ($monthlyBasic * 0.02 + $monthlyBasic * 0.01) * $serviceMonths;
        }

        // 4. THR and Bonus
        $thr = Thr::where('employee_id', $employee->id)
            ->where('period_year', $year)
            ->whereIn('status', ['approved', 'paid'])
            ->first();

        $bonusThr = $thr ? (float) $thr->thr_amount : 0;
        if ($thr && $thr->tax_pph21) {
            $pph21Withheld += (float) $thr->tax_pph21;
        }

        // Point 1-7 & 8 Total Gross
        $point1_gaji = round($gajiPokok);
        $point2_tunjangan_pph = 0;
        $point3_tunjangan_lain = round($tunjanganLain);
        $point4_honorarium = 0;
        $point5_premi_asuransi = round($premiAsuransi);
        $point6_natura = 0;
        $point7_bonus_thr = round($bonusThr);

        $point8_bruto = $point1_gaji + $point2_tunjangan_pph + $point3_tunjangan_lain + 
                         $point4_honorarium + $point5_premi_asuransi + $point6_natura + $point7_bonus_thr;

        // Point 9: Biaya Jabatan (5% maks Rp 500.000 / bulan)
        $maxBiayaJabatan = $serviceMonths * 500000;
        $point9_biaya_jabatan = min(round(0.05 * $point8_bruto), $maxBiayaJabatan);

        // Point 10: Iuran Pensiun / JHT
        $point10_iuran_pensiun = round($iuranPensiunJht);

        // Point 11: Total Pengurangan
        $point11_total_pengurangan = $point9_biaya_jabatan + $point10_iuran_pensiun;

        // Point 12: Penghasilan Neto
        $point12_neto = max(0, $point8_bruto - $point11_total_pengurangan);
        $point13_neto_sebelumnya = 0;
        $point14_neto_setahun = $point12_neto; // Setahunkan jika diperlukan

        // Point 15: PTKP (Penghasilan Tidak Kena Pajak)
        $taxStatus = strtoupper($employee->tax_status ?: 'TK/0');
        $ptkpRates = [
            'TK/0' => 54000000,
            'TK/1' => 58500000,
            'TK/2' => 63000000,
            'TK/3' => 67500000,
            'K/0'  => 58500000,
            'K/1'  => 63000000,
            'K/2'  => 67500000,
            'K/3'  => 72000000,
        ];
        $point15_ptkp = $ptkpRates[$taxStatus] ?? 54000000;

        // Point 16: PKP (Penghasilan Kena Pajak) dibulatkan ke bawah ke ribuan penuh
        $diffPkp = $point14_neto_setahun - $point15_ptkp;
        $point16_pkp = ($diffPkp > 0) ? floor($diffPkp / 1000) * 1000 : 0;

        // Point 17: PPh 21 Terutang (Tarif Progresif UU HPP)
        $point17_pph21_terutang = $this->calculateProgressiveTax($point16_pkp);
        $point18_pph21_sebelumnya = 0;
        $point19_pph21_terutang_final = $point17_pph21_terutang;
        $point20_pph21_telah_dipotong = round($pph21Withheld);

        // Point 21: Kurang / (Lebih) Bayar
        $point21_selisih = $point19_pph21_terutang_final - $point20_pph21_telah_dipotong;

        return [
            'year' => $year,
            'tax_number' => sprintf("1.1-%02d.%02d-%05d", $endMonth, substr($year, -2), $employee->id),
            'start_month' => sprintf("%02d", $startMonth),
            'end_month' => sprintf("%02d", $endMonth),
            'period_months_string' => sprintf("%02d - %02d", $startMonth, $endMonth),
            'service_months' => $serviceMonths,
            'employee' => $employee,
            'tax_status' => $taxStatus,

            // Detail 20 Angka 1721-A1
            'point1_gaji' => $point1_gaji,
            'point2_tunjangan_pph' => $point2_tunjangan_pph,
            'point3_tunjangan_lain' => $point3_tunjangan_lain,
            'point4_honorarium' => $point4_honorarium,
            'point5_premi_asuransi' => $point5_premi_asuransi,
            'point6_natura' => $point6_natura,
            'point7_bonus_thr' => $point7_bonus_thr,
            'point8_bruto' => $point8_bruto,
            'point9_biaya_jabatan' => $point9_biaya_jabatan,
            'point10_iuran_pensiun' => $point10_iuran_pensiun,
            'point11_total_pengurangan' => $point11_total_pengurangan,
            'point12_neto' => $point12_neto,
            'point13_neto_sebelumnya' => $point13_neto_sebelumnya,
            'point14_neto_setahun' => $point14_neto_setahun,
            'point15_ptkp' => $point15_ptkp,
            'point16_pkp' => $point16_pkp,
            'point17_pph21_terutang' => $point17_pph21_terutang,
            'point18_pph21_sebelumnya' => $point18_pph21_sebelumnya,
            'point19_pph21_terutang_final' => $point19_pph21_terutang_final,
            'point20_pph21_telah_dipotong' => $point20_pph21_telah_dipotong,
            'point21_selisih' => $point21_selisih,

            // Short summary aliases
            'gross_income' => $point8_bruto,
            'net_income' => $point12_neto,
            'ptkp' => $point15_ptkp,
            'pkp' => $point16_pkp,
            'tax_payable' => $point19_pph21_terutang_final,
            'tax_withheld' => $point20_pph21_telah_dipotong,
            'tax_difference' => $point21_selisih,
        ];
    }

    /**
     * Indonesian Tax Brackets (UU HPP No. 7 Tahun 2021).
     */
    protected function calculateProgressiveTax(float $pkp): float
    {
        if ($pkp <= 0) return 0;

        $tax = 0;

        // Bracket 1: s/d 60.000.000 (5%)
        $b1 = min($pkp, 60000000);
        $tax += $b1 * 0.05;
        $pkp -= $b1;

        // Bracket 2: > 60.000.000 s/d 250.000.000 (15%)
        if ($pkp > 0) {
            $b2 = min($pkp, 190000000);
            $tax += $b2 * 0.15;
            $pkp -= $b2;
        }

        // Bracket 3: > 250.000.000 s/d 500.000.000 (25%)
        if ($pkp > 0) {
            $b3 = min($pkp, 250000000);
            $tax += $b3 * 0.25;
            $pkp -= $b3;
        }

        // Bracket 4: > 500.000.000 s/d 5.000.000.000 (30%)
        if ($pkp > 0) {
            $b4 = min($pkp, 4500000000);
            $tax += $b4 * 0.30;
            $pkp -= $b4;
        }

        // Bracket 5: > 5.000.000.000 (35%)
        if ($pkp > 0) {
            $tax += $pkp * 0.35;
        }

        return round($tax);
    }
}
