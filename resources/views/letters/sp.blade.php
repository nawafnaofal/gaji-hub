<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Surat Peringatan - {{ $letter->employee->user->name }}</title>
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
        .col-label { width: 28%; }
        .col-colon { width: 3%; }
        .col-val { width: 69%; font-weight: bold; }
        .signature-table { width: 100%; margin-top: 40px; }
        .signature-table td { text-align: center; vertical-align: top; width: 50%; }
        .signature-box { height: 75px; }
    </style>
</head>
<body>
    <div class="kop">
        <div class="company-title">{{ $settings['company_name'] ?? 'PT. GAJI HUB INDONESIA' }}</div>
        <div class="company-address">{{ $settings['company_address'] ?? 'Gedung Wisma HR, Lantai 8, Jakarta Pusat, DKI Jakarta' }}</div>
    </div>

    <div class="title">
        <h2>SURAT PERINGATAN {{ strtoupper(str_replace('_', ' ', $letter->sp_level)) }}</h2>
        <p>Nomor: {{ $letter->letter_number }}</p>
    </div>

    <div class="content">
        <p>Surat Peringatan ini diterbitkan oleh pihak Manajemen Perusahaan kepada:</p>
        
        <table class="table-data">
            <tr>
                <td class="col-label">Nama Karyawan</td>
                <td class="col-colon">:</td>
                <td class="col-val">{{ $letter->employee->user->name }}</td>
            </tr>
            <tr>
                <td class="col-label">Nomor Induk Karyawan</td>
                <td class="col-colon">:</td>
                <td class="col-val">{{ $letter->employee->employee_code }}</td>
            </tr>
            <tr>
                <td class="col-label">Jabatan / Posisi</td>
                <td class="col-colon">:</td>
                <td class="col-val">{{ $letter->employee->job_title ?? 'Karyawan' }}</td>
            </tr>
            <tr>
                <td class="col-label">Departemen / Divisi</td>
                <td class="col-colon">:</td>
                <td class="col-val">{{ $letter->employee->department_id }}</td>
            </tr>
        </table>

        <p>Sehubungan dengan pelanggaran tata tertib dan disiplin kerja yang terjadi pada tanggal <strong>{{ \Carbon\Carbon::parse($letter->violation_date)->translatedFormat('d F Y') }}</strong>, yaitu:</p>
        
        <div style="background-color: #f8f9fa; border-left: 3px solid #000; padding: 10px 15px; margin: 15px 0;">
            <em>"{{ $letter->description }}"</em>
        </div>

        @if($letter->sanction)
            <p>Atas pelanggaran tersebut di atas, pihak perusahaan memberikan tindakan dan sanksi sebagai berikut:</p>
            <div style="padding-left: 15px; margin-bottom: 15px;">
                <strong>{{ $letter->sanction }}</strong>
            </div>
        @endif

        <p>Surat Peringatan ini berlaku selama <strong>6 (enam) bulan</strong> terhitung sejak tanggal diterbitkan hingga tanggal <strong>{{ \Carbon\Carbon::parse($letter->valid_until)->translatedFormat('d F Y') }}</strong>. Apabila dalam kurun waktu tersebut Saudara/i kembali melakukan pelanggaran disiplin serupa maupun pelanggaran lainnya, maka perusahaan akan mengenakan sanksi yang lebih berat sesuai peraturan ketenagakerjaan yang berlaku.</p>

        <p>Demikian Surat Peringatan ini dibuat dan disampaikan agar dapat menjadi perhatian serta bahan introspeksi untuk memperbaiki kinerja dan kedisiplinan kerja ke depannya.</p>
    </div>

    <table class="signature-table">
        <tr>
            <td>
                Penerima SP,<br>
                <div class="signature-box"></div>
                <strong>( {{ $letter->employee->user->name }} )</strong><br>
                <span>Karyawan Bersangkutan</span>
            </td>
            <td>
                Dikeluarkan di Jakarta, {{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}<br>
                Departemen HR & Manajemen,<br>
                <div class="signature-box">
                    @if(isset($settings['director_signature']) && $settings['director_signature'])
                        <img src="{{ public_path('storage/'.$settings['director_signature']) }}" style="max-height: 65px;">
                    @endif
                </div>
                <strong>( {{ $settings['director_name'] ?? ($letter->issued_by ?? 'Pimpinan HRD') }} )</strong><br>
                <span>{{ $settings['director_title'] ?? 'HR Manager / Direktur' }}</span>
            </td>
        </tr>
    </table>
</body>
</html>
