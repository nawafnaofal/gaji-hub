<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Slip Tunjangan Hari Raya (THR) - {{ $thr->employee->user->name }}</title>
    <style>
        body { font-family: sans-serif; font-size: 11px; color: #111; line-height: 1.5; margin: 0; padding: 15px; }
        .wrapper { border: 2px solid #222; border-radius: 8px; padding: 18px; box-sizing: border-box; }
        .header { border-bottom: 2px solid #222; padding-bottom: 12px; margin-bottom: 15px; }
        .company-name { font-size: 16px; font-weight: bold; color: #b91c1c; text-transform: uppercase; }
        .slip-title { font-size: 13px; font-weight: bold; margin-top: 3px; color: #333; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .meta-table td { padding: 3px 0; font-size: 11px; }
        .details-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
        .details-table th { background-color: #f3f4f6; border-top: 1px solid #ddd; border-bottom: 2px solid #222; padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
        .details-table td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        .total-box { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px 14px; margin-top: 15px; }
        .total-amount { font-size: 16px; font-weight: bold; color: #b91c1c; }
        .footer { margin-top: 25px; font-size: 9px; color: #666; border-top: 1px solid #ddd; padding-top: 8px; }
        .signature-table { width: 100%; margin-top: 30px; }
        .signature-box { text-align: center; width: 45%; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <table width="100%">
                <tr>
                    <td>
                        <div class="company-name">{{ $settings['company_name'] ?? 'PT. GAJI HUB INDONESIA' }}</div>
                        <div class="slip-title">SLIP TUNJANGAN HARI RAYA (THR) {{ strtoupper(str_replace('_', ' ', $thr->religious_holiday)) }} {{ $thr->period_year }}</div>
                        <div style="font-size: 10px; color: #666;">Berdasarkan Peraturan Menteri Ketenagakerjaan No. 6 Tahun 2016</div>
                    </td>
                    <td align="right">
                        @if(isset($settings['company_logo']) && $settings['company_logo'])
                            <img src="{{ public_path('storage/'.$settings['company_logo']) }}" style="max-height: 45px;">
                        @endif
                    </td>
                </tr>
            </table>
        </div>

        <table class="meta-table">
            <tr>
                <td width="18%"><strong>Nama Karyawan</strong></td>
                <td width="3%">:</td>
                <td width="35%">{{ $thr->employee->user->name }}</td>
                <td width="18%"><strong>Tanggal Bergabung</strong></td>
                <td width="3%">:</td>
                <td width="23%">{{ $thr->employee->join_date ? \Carbon\Carbon::parse($thr->employee->join_date)->format('d F Y') : '-' }}</td>
            </tr>
            <tr>
                <td><strong>ID / NIK</strong></td>
                <td>:</td>
                <td>{{ $thr->employee->employee_code }}</td>
                <td><strong>Masa Kerja</strong></td>
                <td>:</td>
                <td><strong>{{ $thr->service_months }} Bulan</strong></td>
            </tr>
            <tr>
                <td><strong>Jabatan / Dept</strong></td>
                <td>:</td>
                <td>{{ $thr->employee->job_title ?? $thr->employee->position ?? '-' }} ({{ $thr->employee->department_id ?? '-' }})</td>
                <td><strong>Status Pembayaran</strong></td>
                <td>:</td>
                <td><strong style="color: green; text-transform: uppercase;">{{ $thr->status }}</strong></td>
            </tr>
        </table>

        <table class="details-table">
            <thead>
                <tr>
                    <th>Komponen Perhitungan</th>
                    <th>Dasar Regulasi</th>
                    <th align="right">Jumlah (IDR)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Gaji Pokok Terakhir</td>
                    <td>Upah Pokok Bulanan</td>
                    <td align="right">Rp {{ number_format($thr->basic_salary, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td>Tunjangan Tetap</td>
                    <td>Tunjangan Teratur</td>
                    <td align="right">Rp {{ number_format($thr->fixed_allowance, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td>
                        <strong>Formula Kalkulasi THR</strong>
                        <div style="font-size: 9px; color: #666;">
                            @if($thr->service_months >= 12)
                                Masa kerja &ge; 12 bulan (1x Upah Penuh)
                            @else
                                Masa kerja {{ $thr->service_months }} bulan: ({{ $thr->service_months }}/12) &times; Upah
                            @endif
                        </div>
                    </td>
                    <td>Permenaker 6/2016</td>
                    <td align="right"><strong>Rp {{ number_format($thr->thr_amount, 0, ',', '.') }}</strong></td>
                </tr>
                <tr>
                    <td>Potongan PPh 21 (Bila ada)</td>
                    <td>Pajak Penghasilan Pasal 21</td>
                    <td align="right">Rp {{ number_format($thr->tax_pph21, 0, ',', '.') }}</td>
                </tr>
            </tbody>
        </table>

        <div class="total-box">
            <table width="100%">
                <tr>
                    <td>
                        <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #555;">THR Bersih Diterima (Take Home Pay)</span>
                    </td>
                    <td align="right">
                        <span class="total-amount">Rp {{ number_format($thr->net_amount, 0, ',', '.') }}</span>
                    </td>
                </tr>
            </table>
        </div>

        <table class="signature-table">
            <tr>
                <td class="signature-box">
                    <div>Penerima,</div>
                    <div style="height: 50px;"></div>
                    <div><strong>{{ $thr->employee->user->name }}</strong></div>
                </td>
                <td class="signature-box" style="float: right;">
                    <div>{{ $settings['company_city'] ?? 'Jakarta' }}, {{ $thr->payment_date ? \Carbon\Carbon::parse($thr->payment_date)->format('d F Y') : date('d F Y') }}</div>
                    <div>Departemen HR & Finance</div>
                    <div style="height: 50px;">
                        @if(isset($settings['digital_signature']) && $settings['digital_signature'])
                            <img src="{{ public_path('storage/'.$settings['digital_signature']) }}" style="max-height: 45px;">
                        @endif
                    </div>
                    <div><strong>{{ $settings['company_director'] ?? 'HR Manager' }}</strong></div>
                </td>
            </tr>
        </table>

        <div class="footer">
            <em>Dokumen ini dibuat otomatis oleh Sistem HRIS & Payroll Gaji-Hub dan sah sebagai bukti pemenuhan kewajiban THR Keagamaan sesuai hukum ketenagakerjaan Republik Indonesia.</em>
        </div>
    </div>
</body>
</html>
