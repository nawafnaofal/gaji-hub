<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Slip Kompensasi PKWT - {{ $comp->employee->user->name ?? 'Karyawan' }}</title>
    <style>
        body { font-family: sans-serif; font-size: 11px; color: #111; line-height: 1.5; margin: 0; padding: 15px; }
        .wrapper { border: 2px solid #1e293b; border-radius: 8px; padding: 18px; box-sizing: border-box; }
        .header { border-bottom: 2px solid #1e293b; padding-bottom: 12px; margin-bottom: 15px; }
        .company-name { font-size: 16px; font-weight: bold; color: #0284c7; text-transform: uppercase; }
        .slip-title { font-size: 13px; font-weight: bold; margin-top: 3px; color: #0f172a; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .meta-table td { padding: 3px 0; font-size: 11px; }
        .details-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
        .details-table th { background-color: #f8fafc; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #1e293b; padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
        .details-table td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
        .total-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px 14px; margin-top: 15px; }
        .total-amount { font-size: 16px; font-weight: bold; color: #15803d; }
        .footer { margin-top: 25px; font-size: 9px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 8px; }
        .signature-table { width: 100%; margin-top: 30px; }
        .signature-box { text-align: center; width: 45%; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <table width="100%">
                <tr>
                    <td>
                        <div class="company-name">{{ $settings['company_name'] ?? 'PT. GAJI HUB INDONESIA' }}</div>
                        <div class="slip-title">BUKTI PEMBAYARAN UANG KOMPENSASI PKWT</div>
                        <div style="font-size: 10px; color: #64748b;">
                            Berdasarkan Peraturan Pemerintah (PP) Republik Indonesia No. 35 Tahun 2021 Pasal 15, 16 & 17
                        </div>
                    </td>
                    <td align="right">
                        @if(isset($settings['company_logo']) && $settings['company_logo'] && file_exists(public_path('storage/'.$settings['company_logo'])))
                            <img src="{{ public_path('storage/'.$settings['company_logo']) }}" style="max-height: 45px;">
                        @endif
                    </td>
                </tr>
            </table>
        </div>

        <table class="meta-table">
            <tr>
                <td width="20%"><strong>Nama Karyawan</strong></td>
                <td width="3%">:</td>
                <td width="35%">{{ $comp->employee->user->name ?? '-' }}</td>
                <td width="20%"><strong>Mulai Kontrak</strong></td>
                <td width="3%">:</td>
                <td width="22%">{{ \Carbon\Carbon::parse($comp->contract_start_date)->format('d F Y') }}</td>
            </tr>
            <tr>
                <td><strong>NIK / NIP</strong></td>
                <td>:</td>
                <td>{{ $comp->employee->employee_code ?? '-' }}</td>
                <td><strong>Akhir Kontrak</strong></td>
                <td>:</td>
                <td>{{ \Carbon\Carbon::parse($comp->contract_end_date)->format('d F Y') }}</td>
            </tr>
            <tr>
                <td><strong>Jabatan / Divisi</strong></td>
                <td>:</td>
                <td>{{ $comp->employee->job_title ?? '-' }} / {{ $comp->employee->department ?? '-' }}</td>
                <td><strong>Masa Kerja Efektif</strong></td>
                <td>:</td>
                <td><strong>{{ $comp->tenure_months }} Bulan</strong></td>
            </tr>
            <tr>
                <td><strong>Status Kerja</strong></td>
                <td>:</td>
                <td><span class="badge" style="background:#fef3c7; color:#92400e;">PKWT (Kontrak)</span></td>
                <td><strong>Status Pencairan</strong></td>
                <td>:</td>
                <td>
                    <span class="badge" style="background:{{ $comp->status === 'paid' ? '#dcfce7; color:#166534;' : ($comp->status === 'approved' ? '#dbeafe; color:#1e40af;' : '#f3f4f6; color:#374151;') }}">
                        {{ strtoupper($comp->status) }}
                    </span>
                </td>
            </tr>
        </table>

        <div style="font-weight: bold; margin-bottom: 5px; text-transform: uppercase; font-size: 10px; color: #475569;">
            Rincian Perhitungan Kompensasi
        </div>
        <table class="details-table">
            <thead>
                <tr>
                    <th width="50%">Komponen Perhitungan</th>
                    <th width="20%" style="text-align: center;">Masa / Rasio</th>
                    <th width="30%" style="text-align: right;">Jumlah Nominal (Rp)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>Upah Pokok Bulanan Terakhir</strong><br>
                        <span style="font-size: 9px; color: #64748b;">Dasar upah 1 bulan kerja</span>
                    </td>
                    <td style="text-align: center;">1 Bulan</td>
                    <td style="text-align: right; font-weight: bold;">
                        Rp {{ number_format($comp->monthly_wage, 0, ',', '.') }}
                    </td>
                </tr>
                <tr>
                    <td>
                        <strong>Faktor Prorata Masa Kerja (PP 35/2021)</strong><br>
                        <span style="font-size: 9px; color: #64748b;">Formula: {{ $comp->tenure_months }} bulan / 12 bulan</span>
                    </td>
                    <td style="text-align: center; font-weight: bold; color: #0284c7;">
                        {{ number_format($comp->tenure_months / 12, 4) }}
                    </td>
                    <td style="text-align: right; color: #64748b;">
                        ({{ $comp->tenure_months }}/12) x Upah
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="total-box">
            <table width="100%">
                <tr>
                    <td>
                        <span style="font-size: 12px; font-weight: bold; color: #166534;">TOTAL UANG KOMPENSASI DIBAYARKAN:</span><br>
                        <span style="font-size: 10px; color: #4b5563;">
                            Keterangan: {{ $comp->notes ?? 'Uang kompensasi atas berakhirnya hubungan kerja PKWT.' }}
                        </span>
                    </td>
                    <td align="right">
                        <span class="total-amount">Rp {{ number_format($comp->compensation_amount, 0, ',', '.') }}</span>
                    </td>
                </tr>
            </table>
        </div>

        <table class="signature-table">
            <tr>
                <td class="signature-box">
                    <p style="margin-bottom: 50px;">
                        Penerima (Karyawan),
                    </p>
                    <p style="font-weight: bold; text-decoration: underline;">
                        {{ $comp->employee->user->name ?? 'Karyawan' }}
                    </p>
                </td>
                <td class="signature-box">
                    <p style="margin-bottom: 10px;">
                        {{ $settings['company_city'] ?? 'Jakarta' }}, {{ $comp->paid_at ? \Carbon\Carbon::parse($comp->paid_at)->format('d F Y') : \Carbon\Carbon::now()->format('d F Y') }}<br>
                        HRD / Manajemen Perusahaan,
                    </p>
                    @if(isset($settings['signature_image']) && $settings['signature_image'] && file_exists(public_path('storage/'.$settings['signature_image'])))
                        <img src="{{ public_path('storage/'.$settings['signature_image']) }}" style="max-height: 45px; display: block; margin: 0 auto 5px auto;">
                    @else
                        <div style="height: 40px;"></div>
                    @endif
                    <p style="font-weight: bold; text-decoration: underline;">
                        {{ $settings['hr_director_name'] ?? 'HR & GA Department' }}
                    </p>
                </td>
            </tr>
        </table>

        <div class="footer">
            <table width="100%">
                <tr>
                    <td>
                        Dokumen ini dibuat otomatis secara elektronik oleh sistem <strong>Gaji-Hub HRIS</strong> dan sah tanpa meterai.
                    </td>
                    <td align="right">
                        Dicetak pada: {{ date('d/m/Y H:i:s') }}
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>
