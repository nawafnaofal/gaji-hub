<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Reimbursement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ReimbursementController extends Controller
{
    // HR & Employee
    public function index()
    {
        $user = Auth::user();
        if ($user->role === 'employee') {
            $employeeId = $user->employee ? $user->employee->id : null;
            $claims = Reimbursement::with('employee.user')
                ->where(function($q) use ($employeeId) {
                    $q->where('employee_id', $employeeId)
                      ->orWhereHas('employee', function($subQ) use ($employeeId) {
                          $subQ->where('manager_id', $employeeId);
                      });
                })->orderBy('created_at', 'desc')->get();
        } else {
            // HR/Admin view all
            $claims = Reimbursement::with('employee.user')->orderBy('created_at', 'desc')->get();
        }

        return response()->json(['success' => true, 'data' => $claims]);
    }

    // Employee applies for reimbursement
    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'amount' => 'required|numeric|min:1',
            'description' => 'required|string',
            'attachment' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ]);

        $employee = Auth::user()->employee;
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Anda belum terdaftar sebagai karyawan.'], 403);
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('reimbursements', 'public');
        }

        $claim = Reimbursement::create([
            'employee_id' => $employee->id,
            'date' => $request->date,
            'amount' => $request->amount,
            'description' => $request->description,
            'attachment' => $attachmentPath,
            'status' => $employee->manager_id ? 'pending_manager' : 'pending_hr'
        ]);

        $this->notifyManagerOrHR(
            $employee,
            'Pengajuan Klaim Baru',
            "{$employee->user->name} telah mengajukan reimbursement.",
            '/reimbursements'
        );

        return response()->json(['success' => true, 'data' => $claim]);
    }

    // Manager / HR approves/rejects
    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected,pending_hr'
        ]);

        $claim = Reimbursement::findOrFail($id);
        
        $user = Auth::user();
        if ($user->role === 'employee') {
            if ($claim->employee->manager_id !== $user->employee->id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }
            if ($claim->status !== 'pending_manager') {
                return response()->json(['success' => false, 'message' => 'Invalid state'], 400);
            }
            // Manager hanya bisa menolak atau meneruskan ke HR
            if (!in_array($request->status, ['pending_hr', 'rejected'])) {
                return response()->json(['success' => false, 'message' => 'Manager hanya bisa meneruskan ke HR atau menolak.'], 400);
            }
        } else {
            // HR / Admin
            if ($request->status === 'pending_hr') {
                return response()->json(['success' => false, 'message' => 'Invalid status for HR.'], 400);
            }
        }

        $claim->update(['status' => $request->status]);

        if ($request->status === 'approved') {
            $this->notifyEmployee($claim->employee, 'Klaim Disetujui', 'Pengajuan reimbursement Anda telah disetujui.', '/reimbursements', 'success');
        } elseif ($request->status === 'rejected') {
            $this->notifyEmployee($claim->employee, 'Klaim Ditolak', 'Pengajuan reimbursement Anda ditolak.', '/reimbursements', 'error');
        } elseif ($request->status === 'pending_hr') {
            $this->notifyHR('Persetujuan Lanjutan Klaim', "Pengajuan reimbursement oleh {$claim->employee->user->name} disetujui oleh manajer dan menunggu persetujuan Anda.", '/reimbursements');
        }

        return response()->json(['success' => true, 'data' => $claim]);
    }
}
