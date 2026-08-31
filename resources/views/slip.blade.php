<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Slip Gaji - {{ $payroll->employee->user->name }}</title>
    <style>
        body { font-family: sans-serif; font-size: 14px; color: #333; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: bold; }
        .slip-title { font-size: 18px; margin-top: 5px; }
        .info-table { width: 100%; margin-bottom: 20px; }
        .info-table td { padding: 5px 0; }
        .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .salary-table th, .salary-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        .salary-table th { background-color: #f4f4f4; }
        .total-row { font-weight: bold; background-color: #f4f4f4; }
        .footer { margin-top: 50px; text-align: right; }
        .signature-line { display: inline-block; width: 200px; border-bottom: 1px solid #333; margin-top: 60px; }
    </style>
</head>
<body>

    <div class="header">
        <div class="company-name">{{ $settings['company_name'] ?? 'PT. GAJI HUB INDONESIA' }}</div>
        <div class="slip-title">SLIP GAJI KARYAWAN</div>
        <div>Periode: {{ $payroll->period_month }} / {{ $payroll->period_year }}</div>
    </div>

    <table class="info-table">
        <tr>
            <td width="20%"><strong>Nama Karyawan</strong></td>
            <td width="30%">: {{ $payroll->employee->user->name }}</td>
            <td width="20%"><strong>ID Karyawan</strong></td>
            <td width="30%">: {{ $payroll->employee->employee_code }}</td>
        </tr>
        <tr>
            <td><strong>Departemen</strong></td>
            <td>: {{ $payroll->employee->department_id }}</td>
            <td><strong>Status</strong></td>
            <td>: {{ strtoupper($payroll->status) }}</td>
        </tr>
    </table>

    <table class="salary-table">
        <thead>
            <tr>
                <th width="70%">Keterangan</th>
                <th width="30%">Jumlah</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Gaji Pokok</strong></td>
                <td><strong>Rp {{ number_format($payroll->total_basic, 0, ',', '.') }}</strong></td>
            </tr>
            @if(isset($payroll->details['allowances']['overtime']) && $payroll->details['allowances']['overtime'] > 0)
            <tr>
                <td style="padding-left: 20px; font-size: 13px;">Uang Lembur (Overtime)</td>
                <td style="font-size: 13px;">Rp {{ number_format($payroll->details['allowances']['overtime'], 0, ',', '.') }}</td>
            </tr>
            @endif
            @if(isset($payroll->details['allowances']['reimbursement']) && $payroll->details['allowances']['reimbursement'] > 0)
            <tr>
                <td style="padding-left: 20px; font-size: 13px;">Reimbursement (Klaim)</td>
                <td style="font-size: 13px;">Rp {{ number_format($payroll->details['allowances']['reimbursement'], 0, ',', '.') }}</td>
            </tr>
            @endif
            <tr>
                <td><strong>Total Tunjangan Tambahan</strong></td>
                <td><strong>Rp {{ number_format($payroll->total_allowance, 0, ',', '.') }}</strong></td>
            </tr>

            @if(isset($payroll->details['deductions']['absence_penalty']) && $payroll->details['deductions']['absence_penalty'] > 0)
            <tr>
                <td style="padding-left: 20px; font-size: 13px;">Potongan Absen (Mangkir)</td>
                <td style="font-size: 13px; color: red;">- Rp {{ number_format($payroll->details['deductions']['absence_penalty'], 0, ',', '.') }}</td>
            </tr>
            @endif
            @if(isset($payroll->details['deductions']['late_penalty']) && $payroll->details['deductions']['late_penalty'] > 0)
            <tr>
                <td style="padding-left: 20px; font-size: 13px;">Denda Keterlambatan</td>
                <td style="font-size: 13px; color: red;">- Rp {{ number_format($payroll->details['deductions']['late_penalty'], 0, ',', '.') }}</td>
            </tr>
            @endif
            @if(isset($payroll->details['deductions']['cash_advance']) && $payroll->details['deductions']['cash_advance'] > 0)
            <tr>
                <td style="padding-left: 20px; font-size: 13px;">Potongan Kasbon (Pinjaman)</td>
                <td style="font-size: 13px; color: red;">- Rp {{ number_format($payroll->details['deductions']['cash_advance'], 0, ',', '.') }}</td>
            </tr>
            @endif
            @if(isset($payroll->details['deductions']['bpjs_kesehatan']) && $payroll->details['deductions']['bpjs_kesehatan'] > 0)
            <tr>
                <td style="padding-left: 20px; font-size: 13px;">BPJS Kesehatan (1%)</td>
                <td style="font-size: 13px; color: red;">- Rp {{ number_format($payroll->details['deductions']['bpjs_kesehatan'], 0, ',', '.') }}</td>
            </tr>
            @endif
            @if(isset($payroll->details['deductions']['bpjs_ketenagakerjaan']) && $payroll->details['deductions']['bpjs_ketenagakerjaan'] > 0)
            <tr>
                <td style="padding-left: 20px; font-size: 13px;">BPJS Ketenagakerjaan (3%)</td>
                <td style="font-size: 13px; color: red;">- Rp {{ number_format($payroll->details['deductions']['bpjs_ketenagakerjaan'], 0, ',', '.') }}</td>
            </tr>
            @endif
            @if(isset($payroll->details['deductions']['pph21']) && $payroll->details['deductions']['pph21'] > 0)
            <tr>
                <td style="padding-left: 20px; font-size: 13px;">PPh 21</td>
                <td style="font-size: 13px; color: red;">- Rp {{ number_format($payroll->details['deductions']['pph21'], 0, ',', '.') }}</td>
            </tr>
            @endif
            <tr>
                <td><strong>Total Potongan</strong></td>
                <td style="color: red;"><strong>- Rp {{ number_format($payroll->total_deduction, 0, ',', '.') }}</strong></td>
            </tr>
            <tr class="total-row">
                <td>Gaji Bersih (Take Home Pay)</td>
                <td>Rp {{ number_format($payroll->net_salary, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <div>Jakarta, {{ date('d M Y') }}</div>
        <div>Manajer Keuangan</div>
        <div style="margin-top: 10px; height: 80px; position: relative;">
            @if(isset($settings['signature_path']))
                <img src="{{ public_path('storage/' . $settings['signature_path']) }}" style="max-height: 70px; max-width: 150px; z-index: 2; position: relative;" alt="Signature">
            @endif
            @if(isset($settings['stamp_path']))
                <img src="{{ public_path('storage/' . $settings['stamp_path']) }}" style="max-height: 80px; max-width: 80px; opacity: 0.7; position: absolute; top: 0; right: 0; z-index: 1;" alt="Stamp">
            @endif
            
            @if(!isset($settings['signature_path']) && !isset($settings['stamp_path']))
                <div class="signature-line"></div>
            @endif
        </div>
        <div style="margin-top: 5px;">{{ $settings['company_name'] ?? 'PT. GAJI HUB INDONESIA' }}</div>
    </div>

</body>
</html>
