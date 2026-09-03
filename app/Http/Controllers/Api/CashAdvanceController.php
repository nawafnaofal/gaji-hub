<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashAdvance;
use Illuminate\Http\Request;

class CashAdvanceController extends Controller
{
    public function index()
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        if ($user->role === 'employee') {
            $employeeId = $user->employee ? $user->employee->id : null;
            $cashAdvances = CashAdvance::with('employee.user')
                ->where(function($q) use ($employeeId) {
                    $q->where('employee_id', $employeeId)
                      ->orWhereHas('employee', function($subQ) use ($employeeId) {
                          $subQ->where('manager_id', $employeeId);
                      });
                })->orderBy('date', 'desc')->get();
        } else {
            $cashAdvances = CashAdvance::with('employee.user')->orderBy('date', 'desc')->get();
        }
        
        return response()->json(['success' => true, 'data' => $cashAdvances]);
    }

    public function store(Request $request)
    {
        $user = \Illuminate\Support\Facades\Auth::user();

        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'amount' => 'required|numeric|min:10000',
        ]);

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

        $cashAdvance = CashAdvance::create(array_merge(
            $request->all(),
            ['status' => $employee->manager_id ? 'pending_manager' : 'pending_hr']
        ));

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
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected,pending_hr,paid'
        ]);

        $cashAdvance = CashAdvance::findOrFail($id);
        
        $user = \Illuminate\Support\Facades\Auth::user();
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

        $cashAdvance->update($request->only('status'));

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
    }

    public function destroy($id)
    {
        $cashAdvance = CashAdvance::findOrFail($id);
        $cashAdvance->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kasbon berhasil dihapus.'
        ]);
    }
}
