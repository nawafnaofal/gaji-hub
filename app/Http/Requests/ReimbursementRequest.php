<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReimbursementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'date' => 'required|date',
            'amount' => 'required|numeric|min:1000|max:100000000',
            'description' => 'required|string|max:2000',
            'attachment' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ];
    }

    public function messages(): array
    {
        return [
            'date.required' => 'Tanggal klaim wajib diisi.',
            'amount.required' => 'Nominal klaim wajib diisi.',
            'amount.min' => 'Nominal klaim minimal Rp 1.000.',
            'amount.max' => 'Nominal klaim maksimal Rp 100.000.000.',
            'description.required' => 'Deskripsi klaim wajib diisi.',
            'description.max' => 'Deskripsi klaim maksimal 2000 karakter.',
            'attachment.mimes' => 'Lampiran harus berformat jpeg, png, jpg, atau pdf.',
            'attachment.max' => 'Ukuran lampiran maksimal 5MB.',
        ];
    }
}
