<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReimbursementRequest;
use Illuminate\Http\Request;

use App\Models\Reimbursement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReimbursementController extends Controller
{
    // HR & Employee
    public function index(Request $request)
    {
        $user = Auth::user();
        $perPage = $request->query('per_page', 25);

        $query = Reimbursement::with('employee.user')->orderBy('created_at', 'desc');

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

        $claims = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $claims->items(),
            'pagination' => [
                'current_page' => $claims->currentPage(),
                'last_page' => $claims->lastPage(),
                'per_page' => $claims->perPage(),
                'total' => $claims->total(),
                'from' => $claims->firstItem(),
                'to' => $claims->lastItem(),
            ]
        ]);
    }

    // Employee applies for reimbursement
    public function store(ReimbursementRequest $request)
    {
        $employee = Auth::user()->employee;
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Anda belum terdaftar sebagai karyawan.'], 403);
        }

        return DB::transaction(function () use ($request, $employee) {
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
            ]);

            $status = 'pending_hr';
            if ($employee->manager_id) {
                $status = 'pending_manager';
                // Approval Delegation: Jika manajer cuti hari ini, otomatis eskalasi ke HR
                $isManagerOnLeave = \App\Models\Leave::where('employee_id', $employee->manager_id)
                    ->where('status', 'approved')
                    ->where('start_date', '<=', \Carbon\Carbon::today()->toDateString())
                    ->where('end_date', '>=', \Carbon\Carbon::today()->toDateString())
                    ->exists();
                    
                if ($isManagerOnLeave) {
                    $status = 'pending_hr';
                }
            }
            $claim->status = $status;
            $claim->save();

            Log::info('[REIMBURSEMENT] Employee #{id} submitted reimbursement', [
                'id' => $employee->id,
                'name' => $employee->user->name,
                'amount' => $request->amount,
                'status' => $status,
            ]);

            $this->notifyManagerOrHR(
                $employee,
                'Pengajuan Klaim Baru',
                "{$employee->user->name} telah mengajukan reimbursement.",
                '/reimbursements'
            );

            return response()->json(['success' => true, 'data' => $claim]);
        });
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

        return DB::transaction(function () use ($request, $claim, $user) {
            $claim->update(['status' => $request->status]);

            Log::info('[REIMBURSEMENT] Reimbursement #{claim_id} status updated to {status} by {user}', [
                'claim_id' => $claim->id,
                'status' => $request->status,
                'user' => $user->name,
                'employee' => $claim->employee->user->name ?? 'unknown',
            ]);

            if ($request->status === 'approved') {
                $this->notifyEmployee($claim->employee, 'Klaim Disetujui', 'Pengajuan reimbursement Anda telah disetujui.', '/reimbursements', 'success');
            } elseif ($request->status === 'rejected') {
                $this->notifyEmployee($claim->employee, 'Klaim Ditolak', 'Pengajuan reimbursement Anda ditolak.', '/reimbursements', 'error');
            } elseif ($request->status === 'pending_hr') {
                $this->notifyHR('Persetujuan Lanjutan Klaim', "Pengajuan reimbursement oleh {$claim->employee->user->name} disetujui oleh manajer dan menunggu persetujuan Anda.", '/reimbursements');
            }

            return response()->json(['success' => true, 'data' => $claim]);
        });
    }
}
