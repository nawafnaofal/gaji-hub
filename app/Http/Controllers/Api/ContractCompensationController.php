<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use App\Models\ContractCompensation;
use App\Models\Employee;
use App\Notifications\GenericNotification;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ContractCompensationController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $perPage = $request->query('per_page', 20);

        $query = ContractCompensation::with('employee.user')->orderBy('created_at', 'desc');

        if ($user->role === 'employee') {
            $employeeId = $user->employee ? $user->employee->id : 0;
            $query->where('employee_id', $employeeId);
        }

        if ($request->query('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->query('search')) {
            $search = $request->query('search');
            $query->whereHas('employee.user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $compensations = $query->paginate($perPage);

        // Metrics for HR/Admin
        $metrics = [
            'total_paid' => ContractCompensation::where('status', 'paid')->sum('compensation_amount'),
            'pending_approval' => ContractCompensation::where('status', 'draft')->count(),
            'expiring_soon' => Employee::where('employment_status', 'contract')
                ->whereNotNull('contract_end_date')
                ->whereBetween('contract_end_date', [Carbon::today()->toDateString(), Carbon::today()->addDays(60)->toDateString()])
                ->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $compensations->items(),
            'metrics' => $metrics,
            'pagination' => [
                'current_page' => $compensations->currentPage(),
                'last_page' => $compensations->lastPage(),
                'per_page' => $compensations->perPage(),
                'total' => $compensations->total(),
            ]
        ]);
    }

    /**
     * Daftar radar kontrak PKWT yang akan berakhir (Expiring Contracts Radar)
     */
    public function expiringContracts(Request $request)
    {
        $days = (int) $request->query('days', 60);
        $today = Carbon::today()->toDateString();
        $futureThreshold = Carbon::today()->addDays($days)->toDateString();

        $contractEmployees = Employee::with('user')
            ->where('employment_status', 'contract')
            ->whereNotNull('contract_end_date')
            ->where('contract_end_date', '>=', $today)
            ->where('contract_end_date', '<=', $futureThreshold)
            ->orderBy('contract_end_date', 'asc')
            ->get();

        $radar = $contractEmployees->map(function ($emp) {
            $calc = ContractCompensation::calculateCompensation($emp);
            $daysLeft = Carbon::today()->diffInDays(Carbon::parse($emp->contract_end_date), false);
            $calc['days_left'] = $daysLeft;
            
            // Check if compensation already generated
            $existing = ContractCompensation::where('employee_id', $emp->id)
                ->where('contract_end_date', $emp->contract_end_date)
                ->first();
            $calc['existing_id'] = $existing ? $existing->id : null;
            $calc['existing_status'] = $existing ? $existing->status : null;

            return $calc;
        });

        return response()->json([
            'success' => true,
            'data' => $radar,
        ]);
    }

    /**
     * Generate Uang Kompensasi PKWT untuk karyawan
     */
    public function generate(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'override_end_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        $employee = Employee::with('user')->findOrFail($request->employee_id);
        $calc = ContractCompensation::calculateCompensation($employee, $request->override_end_date);

        if ($calc['tenure_months'] < 1) {
            return response()->json([
                'success' => false,
                'message' => 'Masa kerja kurang dari 1 bulan, belum memenuhi syarat kompensasi PKWT PP 35/2021.'
            ], 422);
        }

        $compensation = ContractCompensation::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'contract_start_date' => $calc['contract_start_date'],
                'contract_end_date' => $calc['contract_end_date'],
            ],
            [
                'tenure_months' => $calc['tenure_months'],
                'monthly_wage' => $calc['monthly_wage'],
                'compensation_amount' => $calc['compensation_amount'],
                'status' => 'draft',
                'notes' => $request->notes ?: $calc['notes'],
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Uang kompensasi PKWT berhasil dihitung dan disimpan sebagai draft.',
            'data' => $compensation,
        ]);
    }

    public function approve($id)
    {
        $comp = ContractCompensation::findOrFail($id);
        $comp->update(['status' => 'approved']);

        return response()->json([
            'success' => true,
            'message' => 'Uang kompensasi PKWT berhasil disetujui.',
            'data' => $comp,
        ]);
    }

    public function markPaid(Request $request, $id)
    {
        $comp = ContractCompensation::with('employee.user')->findOrFail($id);
        $paidDate = $request->input('paid_at', Carbon::today()->toDateString());

        $comp->update([
            'status' => 'paid',
            'paid_at' => $paidDate,
        ]);

        if ($comp->employee && $comp->employee->user) {
            $formattedAmount = number_format($comp->compensation_amount, 0, ',', '.');
            $comp->employee->user->notify(new GenericNotification(
                'Uang Kompensasi PKWT Dicairkan',
                "Uang kompensasi akhir kontrak Anda sebesar Rp {$formattedAmount} telah dicairkan.",
                '/contract-compensations',
                'success'
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Uang kompensasi PKWT berhasil dicairkan.',
            'data' => $comp,
        ]);
    }

    public function downloadSlipPdf($id)
    {
        $comp = ContractCompensation::with('employee.user')->findOrFail($id);
        $user = Auth::user();

        if ($user->role === 'employee' && $comp->employee_id !== $user->employee?->id) {
            abort(403, 'Anda tidak memiliki akses ke slip kompensasi ini.');
        }

        $settings = CompanySetting::pluck('value', 'key')->toArray();

        $pdf = Pdf::loadView('pdf.slip_kompensasi_pkwt', compact('comp', 'settings'))
            ->setPaper('a4', 'portrait');

        $filename = 'Slip_Kompensasi_PKWT_' . str_replace(' ', '_', $comp->employee->user->name ?? 'Karyawan') . '.pdf';

        return $pdf->download($filename);
    }
}
