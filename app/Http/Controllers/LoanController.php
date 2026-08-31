<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Loan;
use Illuminate\Support\Facades\Auth;

class LoanController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if ($user->role === 'employee') {
            if (!$user->employee) return response()->json(['success' => true, 'data' => []]);
            $loans = Loan::with('employee.user')->where('employee_id', $user->employee->id)->orderBy('created_at', 'desc')->get();
        } else {
            $loans = Loan::with('employee.user')->orderBy('created_at', 'desc')->get();
        }
        return response()->json(['success' => true, 'data' => $loans]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if ($user->role !== 'employee' || !$user->employee) {
            return response()->json(['success' => false, 'message' => 'Hanya karyawan yang bisa mengajukan pinjaman'], 403);
        }

        $request->validate([
            'amount' => 'required|numeric|min:100000',
            'duration_months' => 'required|integer|min:1',
            'reason' => 'required|string',
        ]);

        $monthlyInstallment = $request->amount / $request->duration_months;

        $loan = Loan::create([
            'employee_id' => $user->employee->id,
            'amount' => $request->amount,
            'duration_months' => $request->duration_months,
            'monthly_installment' => $monthlyInstallment,
            'remaining_amount' => $request->amount,
            'reason' => $request->reason,
            'status' => 'pending'
        ]);

        return response()->json(['success' => true, 'data' => $loan]);
    }

    public function updateStatus(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'hr'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $loan = Loan::findOrFail($id);
        $loan->update(['status' => $request->status]);

        return response()->json(['success' => true, 'data' => $loan]);
    }
}
