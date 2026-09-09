<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CashAdvanceRequest;
use App\Models\CashAdvance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CashAdvanceController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $perPage = $request->query('per_page', 25);

        $query = CashAdvance::with('employee.user')->orderBy('date', 'desc');

        if ($user->role === 'employee') {
            $employeeId = $user->employee ? $user->employee->id : 0;
            $query->where('employee_id', $employeeId);
        }

        // Filter by status
        if ($request->query('status')) {
            $query->where('status', $request->query('status'));
        }

        // Search by employee name
        if ($request->query('search')) {
            $search = $request->query('search');
            $query->whereHas('employee.user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $cashAdvances = $query->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $cashAdvances->items(),
            'pagination' => [
                'current_page' => $cashAdvances->currentPage(),
                'last_page' => $cashAdvances->lastPage(),
                'per_page' => $cashAdvances->perPage(),
                'total' => $cashAdvances->total(),
                'from' => $cashAdvances->firstItem(),
                'to' => $cashAdvances->lastItem(),
            ]
        ]);
    }

    public function store(CashAdvanceRequest $request)
    {
        $user = Auth::user();
        $employee = \App\Models\Employee::find($request->employee_id);

        // Security check for role employee
        if ($user->role === 'employee') {
            if (!$user->employee || $user->employee->id !== $employee->id) {
                return response()->json(['success' => false, 'message' => 'Anda hanya dapat mengajukan kasbon untuk diri sendiri.'], 403);
            }
        }

        // Plafon check: max 50% of basic salary
        $maxAllowed = round(($employee->basic_salary ?? 0) * 0.5);
        if ($employee->basic_salary > 0 && $request->amount > $maxAllowed) {
            return response()->json([
                'success' => false,
                'message' => 'Nominal kasbon melebihi batas plafon 50% dari gaji pokok (Maksimal: Rp ' . number_format($maxAllowed, 0, ',', '.') . ').'
            ], 422);
        }

        // Check active / unpaid cash advance in the same month
        $requestDate = \Carbon\Carbon::parse($request->date);
        $hasActiveCashAdvance = CashAdvance::where('employee_id', $employee->id)
            ->whereIn('status', ['pending_manager', 'pending_hr', 'approved'])
            ->whereMonth('date', $requestDate->month)
            ->whereYear('date', $requestDate->year)
            ->exists();

        if ($hasActiveCashAdvance) {
            return response()->json([
                'success' => false,
                'message' => 'Anda masih memiliki pengajuan kasbon yang aktif/belum terpotong payroll untuk periode bulan ini.'
            ], 422);
        }

        return DB::transaction(function () use ($request, $employee) {
            $cashAdvance = CashAdvance::create(array_merge(
                $request->validated(),
                ['status' => $employee->manager_id ? 'pending_manager' : 'pending_hr']
            ));

            Log::info('[CASH_ADVANCE] Employee #{id} submitted cash advance', [
                'id' => $employee->id,
                'name' => $employee->user->name,
                'amount' => $request->amount,
            ]);

            $this->notifyManagerOrHR(
                $employee,
                'Pengajuan Kasbon Baru',
                "{$employee->user->name} telah mengajukan kasbon sebesar Rp " . number_format($request->amount, 0, ',', '.'),
                '/cash-advances'
            );

            return response()->json([
                'success' => true,
                'message' => 'Kasbon berhasil diajukan.',
                'data' => $cashAdvance->load('employee.user')
            ]);
        });
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected,pending_hr,paid'
        ]);

        $cashAdvance = CashAdvance::findOrFail($id);
        
        $user = Auth::user();
        if ($user->role === 'employee') {
            if ($cashAdvance->employee->manager_id !== $user->employee->id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }
            if ($cashAdvance->status !== 'pending_manager') {
                return response()->json(['success' => false, 'message' => 'Invalid state'], 400);
            }
            if (!in_array($request->status, ['pending_hr', 'rejected'])) {
                return response()->json(['success' => false, 'message' => 'Manager hanya bisa meneruskan ke HR atau menolak.'], 400);
            }
        } else {
            if ($request->status === 'pending_hr') {
                return response()->json(['success' => false, 'message' => 'Invalid status for HR.'], 400);
            }
        }

        return DB::transaction(function () use ($request, $cashAdvance, $user) {
            $cashAdvance->update($request->only('status'));

            Log::info('[CASH_ADVANCE] CashAdvance #{ca_id} status updated to {status} by {user}', [
                'ca_id' => $cashAdvance->id,
                'status' => $request->status,
                'user' => $user->name,
                'employee' => $cashAdvance->employee->user->name ?? 'unknown',
            ]);

            if ($request->status === 'approved') {
                $this->notifyEmployee($cashAdvance->employee, 'Kasbon Disetujui', 'Pengajuan kasbon Anda telah disetujui.', '/cash-advances', 'success');
            } elseif ($request->status === 'rejected') {
                $this->notifyEmployee($cashAdvance->employee, 'Kasbon Ditolak', 'Pengajuan kasbon Anda ditolak.', '/cash-advances', 'error');
            } elseif ($request->status === 'pending_hr') {
                $this->notifyHR('Persetujuan Lanjutan Kasbon', "Pengajuan kasbon oleh {$cashAdvance->employee->user->name} disetujui oleh manajer dan menunggu persetujuan Anda.", '/cash-advances');
            } elseif ($request->status === 'paid') {
                $this->notifyEmployee($cashAdvance->employee, 'Kasbon Dibayarkan', 'Dana kasbon Anda telah ditransfer/diberikan.', '/cash-advances', 'success');
            }

            return response()->json([
                'success' => true,
                'message' => 'Status kasbon berhasil diupdate.',
                'data' => $cashAdvance->load('employee.user')
            ]);
        });
    }

    public function destroy($id)
    {
        $cashAdvance = CashAdvance::findOrFail($id);
        
        // Only allow deletion of draft/pending items
        if (in_array($cashAdvance->status, ['approved', 'paid'])) {
            return response()->json([
                'success' => false,
                'message' => 'Kasbon yang sudah disetujui atau dibayarkan tidak dapat dihapus.'
            ], 400);
        }

        $cashAdvance->delete();

        Log::info('[CASH_ADVANCE] CashAdvance #{ca_id} deleted by {user}', [
            'ca_id' => $id,
            'user' => Auth::user()->name,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kasbon berhasil dihapus.'
        ]);
    }
}
