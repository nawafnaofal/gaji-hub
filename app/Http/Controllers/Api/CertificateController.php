<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificateController extends Controller
{
    public function downloadPaklaring($id)
    {
        $employee = Employee::with('user')->findOrFail($id);
        $user = Auth::user();

        // Check permission: employee can only download their own paklaring
        if ($user->role === 'employee' && $employee->id !== $user->employee?->id) {
            abort(403, 'Akses ditolak.');
        }

        $settings = CompanySetting::pluck('value', 'key')->toArray();

        $joinDate = Carbon::parse($employee->join_date);
        $resignDate = $employee->resign_date ? Carbon::parse($employee->resign_date) : Carbon::today();
        
        $years = $joinDate->diffInYears($resignDate);
        $months = $joinDate->copy()->addYears($years)->diffInMonths($resignDate);
        $tenure = "{$years} Tahun {$months} Bulan";

        $count = $employee->id;
        $letterNumber = sprintf("PKL/%s/%s/%04d", $resignDate->format('m'), $resignDate->format('Y'), $count);

        $pdf = Pdf::loadView('letters.paklaring', compact('employee', 'settings', 'joinDate', 'resignDate', 'tenure', 'letterNumber'));

        $filename = "Surat_Paklaring_{$employee->user->name}.pdf";
        return $pdf->download($filename);
    }

    public function downloadActiveLetter($id)
    {
        $employee = Employee::with('user')->findOrFail($id);
        $user = Auth::user();

        if ($user->role === 'employee' && $employee->id !== $user->employee?->id) {
            abort(403, 'Akses ditolak.');
        }

        $settings = CompanySetting::pluck('value', 'key')->toArray();
        $joinDate = Carbon::parse($employee->join_date);
        $today = Carbon::today();

        $count = $employee->id;
        $letterNumber = sprintf("SKK/%s/%s/%04d", $today->format('m'), $today->format('Y'), $count);

        $pdf = Pdf::loadView('letters.active_letter', compact('employee', 'settings', 'joinDate', 'today', 'letterNumber'));

        $filename = "Surat_Keterangan_Kerja_{$employee->user->name}.pdf";
        return $pdf->download($filename);
    }
}
