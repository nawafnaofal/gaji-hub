<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WarningLetterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && in_array(auth()->user()->role, ['admin', 'hr']);
    }

    public function rules(): array
    {
        return [
            'employee_id' => 'required|exists:employees,id',
            'sp_level' => 'required|in:sp_1,sp_2,sp_3',
            'violation_date' => 'required|date|before_or_equal:today',
            'description' => 'required|string|max:3000',
            'sanction' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'Karyawan wajib dipilih.',
            'employee_id.exists' => 'Karyawan tidak ditemukan.',
            'sp_level.required' => 'Level SP wajib dipilih.',
            'sp_level.in' => 'Level SP harus SP1, SP2, atau SP3.',
            'violation_date.required' => 'Tanggal pelanggaran wajib diisi.',
            'violation_date.before_or_equal' => 'Tanggal pelanggaran tidak boleh di masa depan.',
            'description.required' => 'Deskripsi pelanggaran wajib diisi.',
            'description.max' => 'Deskripsi pelanggaran maksimal 3000 karakter.',
            'sanction.max' => 'Sanksi maksimal 1000 karakter.',
        ];
    }
}
