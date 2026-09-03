<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Surat Pengalaman Kerja (Paklaring) - {{ $employee->user->name }}</title>
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
        <h2>SURAT KETERANGAN PENGALAMAN KERJA</h2>
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

        <p>Dengan ini menerangkan dengan sesungguhnya bahwa:</p>
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
                <td class="col-label">Jabatan Terakhir</td>
                <td class="col-colon">:</td>
                <td class="col-val">{{ $employee->job_title ?? 'Staff' }}</td>
            </tr>
            <tr>
                <td class="col-label">Departemen</td>
                <td class="col-colon">:</td>
                <td class="col-val">{{ $employee->department_id }}</td>
            </tr>
            <tr>
                <td class="col-label">Masa Kerja</td>
                <td class="col-colon">:</td>
                <td class="col-val">{{ $joinDate->translatedFormat('d F Y') }} s/d {{ $resignDate->translatedFormat('d F Y') }} ({{ $tenure }})</td>
            </tr>
        </table>

        <p>Benar telah bekerja pada perusahaan kami dalam kurun waktu tersebut di atas. Selama masa baktinya di <strong>{{ $settings['company_name'] ?? 'PT. GAJI HUB INDONESIA' }}</strong>, yang bersangkutan telah menunjukkan loyalitas, integritas, serta dedikasi dan kinerja yang baik bagi kemajuan perusahaan.</p>

        <p>Hubungan kerja berakhir atas permohonan pengunduran diri yang bersangkutan secara baik-baik. Manajemen perusahaan menyampaikan rasa terima kasih dan penghargaan yang setinggi-tingginya atas seluruh kontribusi dan kerja sama yang telah diberikan.</p>

        <p>Kami mendoakan semoga Saudara/i dapat meraih kesuksesan dan prestasi yang lebih gemilang dalam jenjang karir selanjutnya.</p>

        <p>Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.</p>
    </div>

    <table class="signature-table">
        <tr>
            <td>
                Jakarta, {{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}<br>
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
