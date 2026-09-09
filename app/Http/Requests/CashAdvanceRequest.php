<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CashAdvanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'amount' => 'required|numeric|min:10000|max:500000000',
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'ID Karyawan wajib diisi.',
            'employee_id.exists' => 'Karyawan tidak ditemukan.',
            'date.required' => 'Tanggal pengajuan wajib diisi.',
            'amount.required' => 'Nominal kasbon wajib diisi.',
            'amount.min' => 'Nominal kasbon minimal Rp 10.000.',
            'amount.max' => 'Nominal kasbon maksimal Rp 500.000.000.',
        ];
    }
}
