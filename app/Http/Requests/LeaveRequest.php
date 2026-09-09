<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LeaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:sick,annual,unpaid',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|max:1000',
            'attachment' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Jenis cuti wajib dipilih.',
            'type.in' => 'Jenis cuti tidak valid.',
            'start_date.required' => 'Tanggal mulai wajib diisi.',
            'start_date.after_or_equal' => 'Tanggal mulai tidak boleh di masa lalu.',
            'end_date.required' => 'Tanggal selesai wajib diisi.',
            'end_date.after_or_equal' => 'Tanggal selesai harus sama atau setelah tanggal mulai.',
            'reason.required' => 'Alasan cuti wajib diisi.',
            'reason.max' => 'Alasan cuti maksimal 1000 karakter.',
            'attachment.mimes' => 'Lampiran harus berformat jpeg, png, jpg, atau pdf.',
            'attachment.max' => 'Ukuran lampiran maksimal 5MB.',
        ];
    }
}
