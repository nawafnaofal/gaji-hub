<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\WarningLetterRequest;
use App\Models\WarningLetter;
use App\Models\Employee;
use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class WarningLetterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $perPage = $request->query('per_page', 25);
        
        // Auto-update expired SPs
        WarningLetter::where('status', 'active')
            ->where('valid_until', '<', Carbon::today()->toDateString())
            ->update(['status' => 'expired']);

        $query = WarningLetter::with(['employee.user']);

        if ($user->role === 'employee') {
            $employeeId = $user->employee ? $user->employee->id : 0;
            $query->where('employee_id', $employeeId);
        }

        // Filter by status
        if ($request->query('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        // Search by employee name
        if ($request->query('search')) {
            $search = $request->query('search');
            $query->whereHas('employee.user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $letters = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $letters->items(),
            'pagination' => [
                'current_page' => $letters->currentPage(),
                'last_page' => $letters->lastPage(),
                'per_page' => $letters->perPage(),
                'total' => $letters->total(),
                'from' => $letters->firstItem(),
                'to' => $letters->lastItem(),
            ]
        ]);
    }

    public function store(WarningLetterRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
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

            Log::warning('[WARNING_LETTER] SP {sp_level} issued to employee #{id}', [
                'sp_level' => $spNumberUpper,
                'id' => $employee->id,
                'name' => $employee->user->name,
                'letter_number' => $letterNumber,
                'issued_by' => Auth::user()->name,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Surat Peringatan {$spNumberUpper} berhasil diterbitkan.",
                'data' => $warningLetter->load('employee.user')
            ]);
        });
    }

    public function revoke($id): JsonResponse
    {
        $letter = WarningLetter::findOrFail($id);
        
        if ($letter->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya SP yang berstatus aktif yang dapat dicabut.'
            ], 400);
        }

        $letter->update(['status' => 'revoked']);

        Log::info('[WARNING_LETTER] SP #{id} revoked by {user}', [
            'id' => $id,
            'user' => Auth::user()->name,
        ]);

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
