<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Surat Keterangan Kerja Aktif - {{ $employee->user->name }}</title>
    <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #111; line-height: 1.6; margin: 30px; }
        .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 25px; }
        .company-title { font-size: 16pt; font-weight: bold; text-transform: uppercase; }
        .company-address { font-size: 10pt; color: #444; }
        .title { text-align: center; margin-bottom: 25px; }
        .title h2 { font-size: 14pt; font-weight: bold; text-decoration: underline; margin-bottom: 3px; text-transform: uppercase; }
        .title p { font-size: 11pt; margin-top: 0; }
        .content { margin-bottom: 20px; }
        .table-data { width: 100%; margin: 15px 0; }
        .table-data td { padding: 4px 0; vertical-align: top; }
        .col-label { width: 30%; }
        .col-colon { width: 3%; }
        .col-val { width: 67%; font-weight: bold; }
        .signature-table { width: 100%; margin-top: 40px; }
        .signature-table td { text-align: right; vertical-align: top; width: 100%; }
        .signature-box { height: 75px; }
    </style>
</head>
<body>
    <div class="kop">
        <div class="company-title">{{ $settings['company_name'] ?? 'PT. GAJI HUB INDONESIA' }}</div>
        <div class="company-address">{{ $settings['company_address'] ?? 'Gedung Wisma HR, Lantai 8, Jakarta Pusat, DKI Jakarta' }}</div>
    </div>

    <div class="title">
        <h2>SURAT KETERANGAN KARYAWAN AKTIF</h2>
        <p>Nomor: {{ $letterNumber }}</p>
    </div>

    <div class="content">
        <p>Yang bertanda tangan di bawah ini:</p>
        <table class="table-data">
            <tr>
                <td class="col-label">Nama</td>
                <td class="col-colon">:</td>
                <td class="col-val">{{ $settings['director_name'] ?? 'Budi Santoso, S.E., M.M.' }}</td>
            </tr>
            <tr>
                <td class="col-label">Jabatan</td>
                <td class="col-colon">:</td>
                <td class="col-val">{{ $settings['director_title'] ?? 'HR Director / Direktur Utama' }}</td>
            </tr>
            <tr>
                <td class="col-label">Perusahaan</td>
                <td class="col-colon">:</td>
                <td class="col-val">{{ $settings['company_name'] ?? 'PT. GAJI HUB INDONESIA' }}</td>
            </tr>
        </table>

        <p>Dengan ini menerangkan bahwa:</p>
        <table class="table-data">
            <tr>
                <td class="col-label">Nama Karyawan</td>
                <td class="col-colon">:</td>
                <td class="col-val">{{ $employee->user->name }}</td>
            </tr>
            <tr>
                <td class="col-label">Nomor Induk Karyawan</td>
                <td class="col-colon">:</td>
                <td class="col-val">{{ $employee->employee_code }}</td>
            </tr>
            <tr>
                <td class="col-label">Jabatan</td>
                <td class="col-colon">:</td>
                <td class="col-val">{{ $employee->job_title ?? 'Staff' }}</td>
            </tr>
            <tr>
                <td class="col-label">Departemen</td>
                <td class="col-colon">:</td>
                <td class="col-val">{{ $employee->department_id }}</td>
            </tr>
            <tr>
                <td class="col-label">Status Karyawan</td>
                <td class="col-colon">:</td>
                <td class="col-val">{{ strtoupper($employee->employment_status ?? 'Karyawan Tetap') }}</td>
            </tr>
            <tr>
                <td class="col-label">Tanggal Masuk Bekerja</td>
                <td class="col-colon">:</td>
                <td class="col-val">{{ $joinDate->translatedFormat('d F Y') }}</td>
            </tr>
        </table>

        <p>Adalah benar merupakan karyawan aktif yang saat ini masih bekerja di <strong>{{ $settings['company_name'] ?? 'PT. GAJI HUB INDONESIA' }}</strong> terhitung sejak tanggal bergabung di atas sampai dengan surat ini diterbitkan.</p>

        <p>Surat keterangan ini diberikan kepada yang bersangkutan untuk keperluan <strong>Kelengkapan Administrasi (Pengajuan Bank / KPR / Visa / Paspor / Lainnya)</strong>.</p>

        <p>Demikian surat keterangan ini kami buat dengan sebenarnya dan penuh rasa tanggung jawab agar dapat dipergunakan sebagaimana mestinya.</p>
    </div>

    <table class="signature-table">
        <tr>
            <td>
                Jakarta, {{ $today->translatedFormat('d F Y') }}<br>
                {{ $settings['company_name'] ?? 'PT. GAJI HUB INDONESIA' }}<br>
                <div class="signature-box">
                    @if(isset($settings['director_signature']) && $settings['director_signature'])
                        <img src="{{ public_path('storage/'.$settings['director_signature']) }}" style="max-height: 65px;">
                    @endif
                </div>
                <strong><u>{{ $settings['director_name'] ?? 'Budi Santoso, S.E., M.M.' }}</u></strong><br>
                <span>{{ $settings['director_title'] ?? 'HR Director / Direktur Utama' }}</span>
            </td>
        </tr>
    </table>
</body>
</html>
