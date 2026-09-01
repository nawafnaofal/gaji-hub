<!DOCTYPE html>
<html>
<head>
    <title>Slip Gaji</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <div style="max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Pemberitahuan Gaji</h2>
        
        <p>Halo, <strong>{{ $employeeName }}</strong>,</p>
        
        <p>Gaji Anda untuk periode <strong>{{ $period }}</strong> telah berhasil diproses.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Total Gaji Bersih (Take Home Pay):</strong></p>
            <h3 style="margin: 10px 0 0 0; color: #27ae60;">Rp {{ number_format($netSalary, 0, ',', '.') }}</h3>
        </div>
        
        <p>Terlampir adalah rincian slip gaji Anda dalam bentuk dokumen PDF. Harap simpan dokumen ini dengan baik sebagai arsip pribadi.</p>
        
        <p>Jika ada pertanyaan terkait rincian gaji, silakan hubungi tim HR kami.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
            Email ini dibuat secara otomatis oleh sistem Gaji Hub.<br>
            Mohon tidak membalas email ini secara langsung.
        </p>
    </div>
</body>
</html>
