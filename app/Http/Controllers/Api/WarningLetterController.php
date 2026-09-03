<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WarningLetter;
use App\Models\Employee;
use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class WarningLetterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        // Auto-update expired SPs
        WarningLetter::where('status', 'active')
            ->where('valid_until', '<', Carbon::today()->toDateString())
            ->update(['status' => 'expired']);

        $query = WarningLetter::with(['employee.user']);

        if ($user->role === 'employee') {
            $employeeId = $user->employee ? $user->employee->id : 0;
            $query->where('employee_id', $employeeId);
        }

        $letters = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $letters
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'sp_level' => 'required|in:sp_1,sp_2,sp_3',
            'violation_date' => 'required|date',
            'description' => 'required|string',
            'sanction' => 'nullable|string'
        ]);

        $employee = Employee::with('user')->findOrFail($request->employee_id);
        $violationDate = Carbon::parse($request->violation_date);
        $validUntil = $violationDate->copy()->addMonths(6);

        $spNumberUpper = strtoupper(str_replace('_', '', $request->sp_level));
        $countThisYear = WarningLetter::whereYear('created_at', Carbon::now()->year)->count() + 1;
        $letterNumber = sprintf("SP/%s/%s/%s/%04d", $spNumberUpper, $violationDate->format('m'), $violationDate->format('Y'), $countThisYear);

        $warningLetter = WarningLetter::create([
            'employee_id' => $employee->id,
            'letter_number' => $letterNumber,
            'sp_level' => $request->sp_level,
            'violation_date' => $violationDate->format('Y-m-d'),
            'valid_until' => $validUntil->format('Y-m-d'),
            'description' => $request->description,
            'sanction' => $request->sanction,
            'status' => 'active',
            'issued_by' => Auth::user()->name
        ]);

        return response()->json([
            'success' => true,
            'message' => "Surat Peringatan {$spNumberUpper} berhasil diterbitkan.",
            'data' => $warningLetter->load('employee.user')
        ]);
    }

    public function revoke($id): JsonResponse
    {
        $letter = WarningLetter::findOrFail($id);
        $letter->update(['status' => 'revoked']);

        return response()->json([
            'success' => true,
            'message' => "Surat Peringatan telah dicabut/dibatalkan."
        ]);
    }

    public function downloadPdf($id)
    {
        $letter = WarningLetter::with(['employee.user'])->findOrFail($id);
        $user = Auth::user();

        if ($user->role === 'employee' && $letter->employee_id !== $user->employee?->id) {
            abort(403, 'Akses ditolak.');
        }

        $settings = CompanySetting::pluck('value', 'key')->toArray();

        $pdf = Pdf::loadView('letters.sp', compact('letter', 'settings'));
        
        $filename = "Surat_Peringatan_{$letter->sp_level}_{$letter->employee->user->name}.pdf";
        return $pdf->download($filename);
    }
}
