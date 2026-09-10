<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Formulir 1721-A1 - {{ $taxData['employee']->user->name ?? 'Karyawan' }} ({{ $taxData['year'] }})</title>
    <style>
        @page {
            margin: 15px 20px;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 8.5pt;
            color: #000;
            line-height: 1.25;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        .bordered-table, .bordered-table th, .bordered-table td {
            border: 1px solid #000;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .bg-gray { background-color: #f0f0f0; }
        
        .header-box {
            border: 2px solid #000;
            padding: 4px;
            margin-bottom: 5px;
        }
        .header-title {
            font-size: 10pt;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
        }
        .form-code {
            font-size: 11pt;
            font-weight: bold;
            border: 2px solid #000;
            padding: 4px 8px;
            text-align: center;
        }
        .section-header {
            background-color: #e5e7eb;
            font-weight: bold;
            font-size: 9pt;
            padding: 3px 6px;
            border: 1px solid #000;
            border-bottom: none;
        }
        .pad-cell {
            padding: 2.5px 5px;
        }
        .no-border-top { border-top: none !important; }
        .no-border-bottom { border-bottom: none !important; }
        .sign-box {
            height: 50px;
        }
    </style>
</head>
<body>

    <!-- Header Formulir -->
    <table style="margin-bottom: 5px;">
        <tr>
            <td width="20%" style="vertical-align: middle;">
                <div style="font-size: 7.5pt; font-weight: bold; text-align: center; border: 1px solid #000; padding: 4px;">
                    KEMENTERIAN KEUANGAN RI<br>
                    DIREKTORAT JENDERAL PAJAK
                </div>
            </td>
            <td width="60%" style="padding: 0 10px;">
                <div class="header-title" style="font-size: 9.5pt;">
                    BUKTI PEMOTONGAN PAJAK PENGHASILAN PASAL 21 BAGI PEGAWAI TETAP ATAU PENERIMA PENSIUN ATAU TUNJANGAN HARI TUA/JAMINAN HARI TUA BERKALA
                </div>
            </td>
            <td width="20%" style="vertical-align: middle; text-align: right;">
                <div class="form-code">
                    FORMULIR 1721 - A1
                </div>
                <div style="font-size: 7.5pt; text-align: center; margin-top: 2px;">
                    Lembar ke-1 : Untuk Pegawai
                </div>
            </td>
        </tr>
    </table>

    <!-- Metadata Nomor & Masa -->
    <table class="bordered-table" style="margin-bottom: 5px; font-size: 8pt;">
        <tr class="bg-gray">
            <td width="30%" class="pad-cell font-bold">NOMOR BUKTI PEMOTONGAN :</td>
            <td width="35%" class="pad-cell font-bold" style="font-family: monospace; font-size: 9pt;">
                {{ $taxData['tax_number'] }}
            </td>
            <td width="20%" class="pad-cell font-bold text-right">MASA PEROLEHAN PENGHASILAN :</td>
            <td width="15%" class="pad-cell font-bold text-center" style="font-family: monospace; font-size: 9pt;">
                [ {{ $taxData['start_month'] }} - {{ $taxData['end_month'] }} ]
            </td>
        </tr>
    </table>

    <!-- BAGIAN A: IDENTITAS PENERIMA PENGHASILAN -->
    <div class="section-header">A. IDENTITAS PENERIMA PENGHASILAN YANG DIPOTONG</div>
    <table class="bordered-table" style="margin-bottom: 5px; font-size: 8pt;">
        <tr>
            <td width="25%" class="pad-cell">1. NPWP</td>
            <td width="35%" class="pad-cell font-bold" style="font-family: monospace;">
                {{ $taxData['employee']->npwp_number ?: '00.000.000.0-000.000' }}
            </td>
            <td width="20%" class="pad-cell">6. STATUS PTKP</td>
            <td width="20%" class="pad-cell font-bold text-center">
                {{ $taxData['tax_status'] }}
            </td>
        </tr>
        <tr>
            <td class="pad-cell">2. NIK / NO. PASPOR</td>
            <td class="pad-cell" style="font-family: monospace;">
                {{ $taxData['employee']->employee_code }}
            </td>
            <td class="pad-cell">7. NAMA JABATAN</td>
            <td class="pad-cell font-bold">
                {{ $taxData['employee']->job_title ?: ($taxData['employee']->position ?: 'Staff') }}
            </td>
        </tr>
        <tr>
            <td class="pad-cell">3. NAMA LENGKAP</td>
            <td class="pad-cell font-bold" colspan="3">
                {{ strtoupper($taxData['employee']->user->name ?? 'KARYAWAN') }}
            </td>
        </tr>
        <tr>
            <td class="pad-cell">4. ALAMAT LENGKAP</td>
            <td class="pad-cell" colspan="3">
                {{ $taxData['employee']->address ?: 'Alamat belum diatur dalam profil sistem.' }}
            </td>
        </tr>
        <tr>
            <td class="pad-cell">5. JENIS KELAMIN</td>
            <td class="pad-cell" colspan="3">
                LAKI-LAKI / PEREMPUAN
            </td>
        </tr>
    </table>

    <!-- BAGIAN B: RINCIAN PENGHASILAN DAN PERHITUNGAN PPh 21 -->
    <div class="section-header">B. RINCIAN PENGHASILAN DAN PENGHITUNGAN PPh PASAL 21</div>
    <table class="bordered-table" style="margin-bottom: 5px; font-size: 7.8pt;">
        <tr class="bg-gray font-bold text-center">
            <td width="6%" class="pad-cell">NO.</td>
            <td width="64%" class="pad-cell">URAIAN RINCIAN PENGHASILAN &amp; PENGURANGAN</td>
            <td width="30%" class="pad-cell">JUMLAH (RUPIAH)</td>
        </tr>

        <!-- KODE OBJEK PAJAK -->
        <tr>
            <td class="pad-cell text-center font-bold" colspan="2">KODE OBJEK PAJAK : 21-100-01 (Pegawai Tetap)</td>
            <td class="pad-cell text-center font-bold">TAHUN PAJAK : {{ $taxData['year'] }}</td>
        </tr>

        <!-- PENGHASILAN BRUTO -->
        <tr class="bg-gray font-bold">
            <td class="pad-cell text-center" colspan="3">PENGHASILAN BRUTO :</td>
        </tr>
        <tr>
            <td class="pad-cell text-center">1.</td>
            <td class="pad-cell">Gaji / Pensiun atau THT / JHT</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point1_gaji'], 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td class="pad-cell text-center">2.</td>
            <td class="pad-cell">Tunjangan PPh</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point2_tunjangan_pph'], 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td class="pad-cell text-center">3.</td>
            <td class="pad-cell">Tunjangan Lainnya, Uang Lembur, dan sebagainya</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point3_tunjangan_lain'], 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td class="pad-cell text-center">4.</td>
            <td class="pad-cell">Honorarium dan Imbalan Lain Sejenisnya</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point4_honorarium'], 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td class="pad-cell text-center">5.</td>
            <td class="pad-cell">Premi Asuransi yang dibayar Pemberi Kerja (JKK, JKM, BPJS Kes)</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point5_premi_asuransi'], 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td class="pad-cell text-center">6.</td>
            <td class="pad-cell">Penerimaan dalam bentuk Natura dan Kenikmatan lainnya</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point6_natura'], 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td class="pad-cell text-center">7.</td>
            <td class="pad-cell">Tantiem, Bonus, Gratifikasi, Jasa Produksi, dan THR</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point7_bonus_thr'], 0, ',', '.') }}</td>
        </tr>
        <tr class="font-bold bg-gray">
            <td class="pad-cell text-center">8.</td>
            <td class="pad-cell">JUMLAH PENGHASILAN BRUTO (1 s.d. 7)</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point8_bruto'], 0, ',', '.') }}</td>
        </tr>

        <!-- PENGURANGAN -->
        <tr class="bg-gray font-bold">
            <td class="pad-cell text-center" colspan="3">PENGURANGAN :</td>
        </tr>
        <tr>
            <td class="pad-cell text-center">9.</td>
            <td class="pad-cell">Biaya Jabatan / Biaya Pensiun (5% x Bruto, maks. Rp 500.000 / bulan)</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point9_biaya_jabatan'], 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td class="pad-cell text-center">10.</td>
            <td class="pad-cell">Iuran Pensiun atau Iuran THT / JHT yang dibayar sendiri oleh Pegawai</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point10_iuran_pensiun'], 0, ',', '.') }}</td>
        </tr>
        <tr class="font-bold bg-gray">
            <td class="pad-cell text-center">11.</td>
            <td class="pad-cell">JUMLAH PENGURANGAN (9 s.d. 10)</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point11_total_pengurangan'], 0, ',', '.') }}</td>
        </tr>

        <!-- PENGHITUNGAN PPh PASAL 21 -->
        <tr class="bg-gray font-bold">
            <td class="pad-cell text-center" colspan="3">PENGHITUNGAN PPh PASAL 21 :</td>
        </tr>
        <tr>
            <td class="pad-cell text-center">12.</td>
            <td class="pad-cell">JUMLAH PENGHASILAN NETO (8 - 11)</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point12_neto'], 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td class="pad-cell text-center">13.</td>
            <td class="pad-cell">Penghasilan Neto Masa Sebelumnya</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point13_neto_sebelumnya'], 0, ',', '.') }}</td>
        </tr>
        <tr class="font-bold">
            <td class="pad-cell text-center">14.</td>
            <td class="pad-cell">JUMLAH PENGHASILAN NETO UNTUK PPh PASAL 21 (SETAHUN / DISETAHUNKAN)</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point14_neto_setahun'], 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td class="pad-cell text-center">15.</td>
            <td class="pad-cell">Penghasilan Tidak Kena Pajak (PTKP) [{{ $taxData['tax_status'] }}]</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point15_ptkp'], 0, ',', '.') }}</td>
        </tr>
        <tr class="font-bold bg-gray">
            <td class="pad-cell text-center">16.</td>
            <td class="pad-cell">PENGHASILAN KENA PAJAK SETAHUN / DISETAHUNKAN (14 - 15)</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point16_pkp'], 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td class="pad-cell text-center">17.</td>
            <td class="pad-cell">PPh Pasal 21 atas Penghasilan Kena Pajak Setahun / Disetahukan (Tarif Progresif UU HPP)</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point17_pph21_terutang'], 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td class="pad-cell text-center">18.</td>
            <td class="pad-cell">PPh Pasal 21 yang telah dipotong Masa Sebelumnya</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point18_pph21_sebelumnya'], 0, ',', '.') }}</td>
        </tr>
        <tr class="font-bold bg-gray">
            <td class="pad-cell text-center">19.</td>
            <td class="pad-cell">PPh PASAL 21 TERUTANG (17 - 18)</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point19_pph21_terutang_final'], 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td class="pad-cell text-center">20.</td>
            <td class="pad-cell">PPh Pasal 21 yang telah Dipotong dan Dilunasi Melalui Payroll</td>
            <td class="pad-cell text-right">{{ number_format($taxData['point20_pph21_telah_dipotong'], 0, ',', '.') }}</td>
        </tr>
        <tr class="font-bold">
            <td class="pad-cell text-center">21.</td>
            <td class="pad-cell">PPh PASAL 21 KURANG / (LEBIH) DIPOTONG (19 - 20) [STATUS: {{ $taxData['tax_difference'] == 0 ? 'NIHIL' : number_format($taxData['tax_difference'], 0, ',', '.') }}]</td>
            <td class="pad-cell text-right" style="color: {{ $taxData['tax_difference'] == 0 ? '#000' : ($taxData['tax_difference'] > 0 ? '#b91c1c' : '#047857') }}">
                {{ $taxData['tax_difference'] == 0 ? '0 (NIHIL)' : number_format($taxData['tax_difference'], 0, ',', '.') }}
            </td>
        </tr>
    </table>

    <!-- BAGIAN C: IDENTITAS PEMOTONG PAJAK -->
    <div class="section-header">C. IDENTITAS PEMOTONG PAJAK</div>
    <table class="bordered-table" style="font-size: 8pt;">
        <tr>
            <td width="60%" class="pad-cell" style="vertical-align: top;">
                <table style="font-size: 8pt;">
                    <tr>
                        <td width="30%" class="pad-cell">1. NPWP PEMOTONG</td>
                        <td width="70%" class="pad-cell font-bold" style="font-family: monospace;">
                            {{ $settings['company_npwp'] ?? '01.234.567.8-012.000' }}
                        </td>
                    </tr>
                    <tr>
                        <td class="pad-cell">2. NAMA PEMOTONG</td>
                        <td class="pad-cell font-bold">
                            {{ $settings['company_name'] ?? 'PT GAJI HUB INDONESIA' }}
                        </td>
                    </tr>
                    <tr>
                        <td class="pad-cell">3. ALAMAT PEMOTONG</td>
                        <td class="pad-cell">
                            {{ $settings['company_address'] ?? 'Jakarta Pusat, DKI Jakarta' }}
                        </td>
                    </tr>
                </table>
            </td>
            <td width="40%" class="pad-cell text-center" style="vertical-align: top;">
                <div style="font-size: 7.5pt; margin-bottom: 2px;">
                    Jakarta, 31 Desember {{ $taxData['year'] }}<br>
                    <strong>Pemberi Kerja / Kuasa Pemotong Pajak</strong>
                </div>

                @if(!empty($settings['company_signature']))
                    <div style="height: 45px; text-align: center; margin: 3px 0;">
                        <img src="{{ public_path('storage/' . $settings['company_signature']) }}" style="max-height: 40px;">
                    </div>
                @else
                    <div style="height: 45px; line-height: 45px; color: #999; font-style: italic;">
                        [ Tanda Tangan &amp; Cap Perusahaan ]
                    </div>
                @endif

                <div class="font-bold" style="text-decoration: underline;">
                    {{ $settings['hr_director_name'] ?? ($settings['company_director'] ?? 'Direktur Utama') }}
                </div>
                <div style="font-size: 7pt; color: #555;">
                    Bukti potong ini sah dihasilkan secara elektronik oleh Sistem HRIS Gaji-Hub
                </div>
            </td>
        </tr>
    </table>

</body>
</html>
