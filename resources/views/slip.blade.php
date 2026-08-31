<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Slip Gaji - {{ $payroll->employee->user->name }}</title>
    <style>
        body { font-family: sans-serif; font-size: 11px; color: #000; line-height: 1.4; margin: 0; padding: 0; }
        .wrapper { border: 2px solid #000; width: 100%; box-sizing: border-box; }
        .header-table { width: 100%; border-bottom: 2px solid #000; }
        .header-table td { padding: 5px; }
        .company-name { font-size: 14px; font-weight: bold; text-transform: uppercase; }
        .slip-title { font-size: 12px; font-weight: bold; }
        
        .info-table { width: 100%; border-bottom: 2px solid #000; }
        .info-table td { padding: 3px 5px; vertical-align: top; }
        
        .main-table { width: 100%; border-collapse: collapse; }
        .main-table td { border-right: 2px solid #000; vertical-align: top; padding: 0; }
        .main-table td:last-child { border-right: none; }
        
        .section { padding: 5px; }
        .section-title { font-weight: bold; text-decoration: underline; margin-bottom: 5px; }
        
        .detail-table { width: 100%; border-collapse: collapse; }
        .detail-table td { padding: 2px 0; }
        .col-label { width: 50%; }
        .col-colon { width: 2%; text-align: center; }
        .col-value { width: 48%; text-align: right; }
        
        .total-row-container { width: 100%; border-top: 2px solid #000; border-bottom: 2px solid #000; border-collapse: collapse; }
        .total-row-container td { border-right: 2px solid #000; padding: 5px; font-weight: bold; }
        .total-row-container td:last-child { border-right: none; }

        .take-home-container { width: 100%; border-bottom: 2px solid #000; border-collapse: collapse; }
        .take-home-container td { padding: 10px 5px; font-weight: bold; font-size: 12px; }
        
        .footer { padding: 5px; font-size: 10px; color: #d00; font-weight: bold; }
        .footer span { color: #000; font-weight: normal; }
    </style>
</head>
<body>
    @php
        $details = is_string($payroll->details) ? json_decode($payroll->details, true) : $payroll->details;
        $allowances = $details['allowances'] ?? [];
        $benefits = $details['benefits'] ?? [];
        $deductions = $details['deductions'] ?? [];
        $attendance = $details['attendance_summary'] ?? [];
    @endphp

    <div class="wrapper">
        <table class="header-table" cellspacing="0" cellpadding="0">
            <tr>
                <td width="70%">
                    <div class="company-name">{{ $settings['company_name'] ?? 'PT. GAJI HUB INDONESIA' }}</div>
                    <div class="slip-title">Slip Gaji Periode {{ \Carbon\Carbon::createFromFormat('m', $payroll->period_month)->translatedFormat('F') }} {{ $payroll->period_year }}</div>
                </td>
                <td width="30%" style="text-align: right;">
                    <!-- Placeholder for logo, if available. For now just text or empty -->
                    @if(isset($settings['company_logo']) && $settings['company_logo'])
                        <img src="{{ public_path('storage/'.$settings['company_logo']) }}" style="max-height: 40px;">
                    @else
                        <strong>[LOGO]</strong>
                    @endif
                </td>
            </tr>
        </table>

        <table class="info-table" cellspacing="0" cellpadding="0">
            <tr>
                <td width="10%">NIK</td>
                <td width="40%">: {{ $payroll->employee->employee_code }}</td>
                <td width="15%">Jabatan</td>
                <td width="35%">: {{ $payroll->employee->job_title }}</td>
            </tr>
            <tr>
                <td>Nama</td>
                <td>: {{ $payroll->employee->user->name }}</td>
                <td>Departemen</td>
                <td>: {{ $payroll->employee->department_id }}</td>
            </tr>
        </table>

        <table class="main-table" cellspacing="0" cellpadding="0">
            <tr>
                <td width="50%">
                    <div class="section">
                        <div class="section-title">Pendapatan :</div>
                        <table class="detail-table">
                            <tr>
                                <td class="col-label">Gaji Pokok</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">{{ number_format($payroll->total_basic, 0, ',', '.') }}</td>
                            </tr>
                            <tr>
                                <td class="col-label">Tunjangan Jabatan</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">-</td>
                            </tr>
                            <tr>
                                <td class="col-label">Tunjangan Transportasi (Rp 45.000 / Kehadiran)</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">{{ number_format($allowances['transport'] ?? 0, 0, ',', '.') }}</td>
                            </tr>
                            <tr>
                                <td class="col-label">Tunjangan Makan (Rp 45.000 / Kehadiran)</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">{{ number_format($allowances['meal'] ?? 0, 0, ',', '.') }}</td>
                            </tr>
                            <tr>
                                <td class="col-label">Insentif / Reimbursement</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">{{ ($allowances['reimbursement'] ?? 0) > 0 ? number_format($allowances['reimbursement'], 0, ',', '.') : '-' }}</td>
                            </tr>
                            <tr>
                                <td class="col-label">Overtime</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">{{ ($allowances['overtime'] ?? 0) > 0 ? number_format($allowances['overtime'], 0, ',', '.') : '-' }}</td>
                            </tr>
                        </table>

                        <br><br>
                        <div class="section-title">Benefit yang diberikan oleh Perusahaan</div>
                        <table class="detail-table">
                            <tr>
                                <td class="col-label">BPJS TK JHT 3.70%</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">{{ number_format($benefits['bpjs_tk_jht'] ?? 0, 2, ',', '.') }}</td>
                            </tr>
                            <tr>
                                <td class="col-label">BPJS TK JKK 0.24%</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">{{ number_format($benefits['bpjs_tk_jkk'] ?? 0, 2, ',', '.') }}</td>
                            </tr>
                            <tr>
                                <td class="col-label">BPJS TK JKM 0.30%</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">{{ number_format($benefits['bpjs_tk_jkm'] ?? 0, 2, ',', '.') }}</td>
                            </tr>
                            <tr>
                                <td class="col-label">BPJS TK JP 2%</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">{{ number_format($benefits['bpjs_tk_jp'] ?? 0, 2, ',', '.') }}</td>
                            </tr>
                            <tr>
                                <td class="col-label">BPJS Kesehatan 4%</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">{{ number_format($benefits['bpjs_kesehatan'] ?? 0, 2, ',', '.') }}</td>
                            </tr>
                            <tr>
                                <td class="col-label"></td>
                                <td class="col-colon"></td>
                                <td class="col-value" style="border-top: 1px solid #000; padding-top: 2px;">
                                    @php
                                        $totalBenefit = array_sum($benefits);
                                    @endphp
                                    {{ number_format($totalBenefit, 2, ',', '.') }}
                                </td>
                            </tr>
                        </table>
                    </div>
                </td>
                <td width="50%">
                    <div class="section">
                        <div class="section-title">Potongan :</div>
                        <table class="detail-table">
                            <tr>
                                <td class="col-label">BPJS Kesehatan 1%</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">{{ ($deductions['bpjs_kesehatan'] ?? 0) > 0 ? number_format($deductions['bpjs_kesehatan'], 0, ',', '.') : '-' }}</td>
                            </tr>
                            <tr>
                                <td class="col-label">BPJS TK JHT 2%</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">{{ ($deductions['bpjs_tk_jht'] ?? 0) > 0 ? number_format($deductions['bpjs_tk_jht'], 0, ',', '.') : '-' }}</td>
                            </tr>
                            <tr>
                                <td class="col-label">BPJS TK JP 1%</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">{{ ($deductions['bpjs_tk_jp'] ?? 0) > 0 ? number_format($deductions['bpjs_tk_jp'], 0, ',', '.') : '-' }}</td>
                            </tr>
                            <tr>
                                <td class="col-label">Potongan PPH 21</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">{{ ($deductions['pph21'] ?? 0) > 0 ? number_format($deductions['pph21'], 0, ',', '.') : '-' }}</td>
                            </tr>
                            <tr>
                                <td class="col-label">Potongan Kasbon / Pinjaman</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">
                                    @php $totalKasbon = ($deductions['cash_advance'] ?? 0) + ($deductions['loan_installment'] ?? 0); @endphp
                                    {{ $totalKasbon > 0 ? number_format($totalKasbon, 0, ',', '.') : '-' }}
                                </td>
                            </tr>
                            <tr>
                                <td class="col-label">Potongan Absen / Keterlambatan</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">
                                    @php $totalAbsen = ($deductions['absence_penalty'] ?? 0) + ($deductions['late_penalty'] ?? 0); @endphp
                                    {{ $totalAbsen > 0 ? number_format($totalAbsen, 0, ',', '.') : '-' }}
                                </td>
                            </tr>
                            <tr>
                                <td class="col-label">Potongan Seragam</td>
                                <td class="col-colon">:</td>
                                <td class="col-value">-</td>
                            </tr>
                        </table>

                        <br><br><br><br>
                        <div class="section-title" style="text-decoration: underline;">KETERANGAN</div>
                        <table class="detail-table">
                            <tr>
                                <td class="col-label">Periode {{ \Carbon\Carbon::createFromFormat('m', $payroll->period_month)->translatedFormat('F') }}</td>
                                <td class="col-colon">:</td>
                                <td style="text-align: left;">{{ $attendance['total_days'] ?? '-' }} Hari</td>
                            </tr>
                            <tr>
                                <td class="col-label">Jumlah kehadiran</td>
                                <td class="col-colon">:</td>
                                <td style="text-align: left;">{{ $attendance['present'] ?? '-' }} Hari</td>
                            </tr>
                            <tr>
                                <td class="col-label">Tanpa keterangan</td>
                                <td class="col-colon">:</td>
                                <td style="text-align: left;">{{ ($attendance['absent'] ?? 0) > 0 ? $attendance['absent'] : '-' }} Hari</td>
                            </tr>
                            <tr>
                                <td class="col-label">Izin</td>
                                <td class="col-colon">:</td>
                                <td style="text-align: left;">{{ ($attendance['permit'] ?? 0) > 0 ? $attendance['permit'] : '-' }} Hari</td>
                            </tr>
                            <tr>
                                <td class="col-label">Pulang lebih awal</td>
                                <td class="col-colon">:</td>
                                <td style="text-align: left;">- Hari</td>
                            </tr>
                            <tr>
                                <td class="col-label">Cuti</td>
                                <td class="col-colon">:</td>
                                <td style="text-align: left;">{{ ($attendance['leave'] ?? 0) > 0 ? $attendance['leave'] : '-' }} Hari</td>
                            </tr>
                            <tr>
                                <td class="col-label">Sakit</td>
                                <td class="col-colon">:</td>
                                <td style="text-align: left;">{{ ($attendance['sick'] ?? 0) > 0 ? $attendance['sick'] : '-' }} Hari</td>
                            </tr>
                        </table>
                    </div>
                </td>
            </tr>
        </table>

        <table class="total-row-container">
            <tr>
                <td width="15%">Jumlah Pendapatan</td>
                <td width="35%">: {{ number_format($payroll->total_basic + $payroll->total_allowance, 0, ',', '.') }}</td>
                <td width="15%">Jumlah Potongan</td>
                <td width="35%">: {{ number_format($payroll->total_deduction, 0, ',', '.') }}</td>
            </tr>
        </table>

        <table class="take-home-container">
            <tr>
                <td width="25%">Gaji Yang Diterima</td>
                <td width="75%">: {{ number_format($payroll->net_salary, 0, ',', '.') }}</td>
            </tr>
        </table>

        <div class="footer">
            Note : <br>
            <span>Slip Gaji ini adalah sah sehingga tidak diperlukan tanda-tangan karyawan sebagai tanda-terimanya.</span>
        </div>
    </div>
</body>
</html>
