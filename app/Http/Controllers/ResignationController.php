<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Resignation;
use App\Models\Employee;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ResignationController extends Controller
{
    public function index()
    {
        $resignations = Resignation::with('employee.user')->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $resignations]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'resign_date' => 'required|date',
            'reason' => 'required|string',
            'type' => 'required|in:voluntary,terminated'
        ]);

        $employee = Employee::findOrFail($request->employee_id);
        $joinDate = Carbon::parse($employee->join_date);
        $resignDate = Carbon::parse($request->resign_date);
        $yearsOfService = $joinDate->diffInYears($resignDate);

        // Simple UU Cipta Kerja Calculator
        $basicSalary = $employee->basic_salary;
        
        $severanceMonths = min(floor($yearsOfService) + 1, 9);
        if ($request->type === 'voluntary') {
            $severanceMonths = 0; // Uang pesangon usually 0 if voluntary, only UPH/UPMK
        }

        $upmkMonths = 0;
        if ($yearsOfService >= 3 && $yearsOfService < 6) $upmkMonths = 2;
        elseif ($yearsOfService >= 6 && $yearsOfService < 9) $upmkMonths = 3;
        elseif ($yearsOfService >= 9 && $yearsOfService < 12) $upmkMonths = 4;
        // ... simplified

        $severancePay = $severanceMonths * $basicSalary;
        $upmkPay = $upmkMonths * $basicSalary;
        $uphPay = 0; // Cuti yang belum diambil, dll. Diabaikan untuk simpel.

        $resignation = Resignation::create([
            'employee_id' => $employee->id,
            'resign_date' => $request->resign_date,
            'reason' => $request->reason,
            'type' => $request->type,
            'severance_pay' => $severancePay,
            'upmk_pay' => $upmkPay,
            'uph_pay' => $uphPay,
            'status' => 'pending'
        ]);

        return response()->json(['success' => true, 'data' => $resignation]);
    }

    public function update(Request $request, $id)
    {
        $resignation = Resignation::findOrFail($id);
        $resignation->update(['status' => $request->status]);

        if ($request->status === 'approved') {
            $resignation->employee->update(['employment_status' => 'inactive', 'resign_date' => $resignation->resign_date]);
        }

        return response()->json(['success' => true, 'data' => $resignation]);
    }
}
