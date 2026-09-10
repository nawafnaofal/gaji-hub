<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShiftExchange;
use App\Models\EmployeeShift;
use App\Models\Employee;
use App\Notifications\GenericNotification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ShiftExchangeController extends Controller
{
    /**
     * List shift exchange requests according to role.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $employee = $user->employee;
        $role = $user->role;

        $eagerLoads = [
            'requester.user',
            'requesterShift.workSchedule',
            'targetEmployee.user',
            'targetShift.workSchedule',
            'approver',
        ];

        $data = [
            'my_requests' => [],
            'incoming_requests' => [],
            'pending_approvals' => [],
            'all_requests' => [],
        ];

        if ($employee) {
            $data['my_requests'] = ShiftExchange::with($eagerLoads)
                ->where('requester_id', $employee->id)
                ->orderBy('created_at', 'desc')
                ->get();

            $data['incoming_requests'] = ShiftExchange::with($eagerLoads)
                ->where('target_employee_id', $employee->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        if (in_array($role, ['admin', 'hr', 'manager'])) {
            $query = ShiftExchange::with($eagerLoads)->orderBy('created_at', 'desc');

            if ($role === 'manager' && $employee) {
                // Requests where requester or target is subordinate
                $subordinateIds = Employee::where('manager_id', $employee->id)->pluck('id');
                $query->where(function ($q) use ($subordinateIds) {
                    $q->whereIn('requester_id', $subordinateIds)
                      ->orWhereIn('target_employee_id', $subordinateIds);
                });
            }

            $data['all_requests'] = $query->get();
            $data['pending_approvals'] = $query->where('status', 'pending_approval')->get();
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get shifts available for exchange (today onwards).
     */
    public function availableShifts(Request $request): JsonResponse
    {
        $employee = Auth::user()->employee;
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Bukan akun karyawan.'], 403);
        }

        $today = Carbon::today()->format('Y-m-d');

        // 1. My upcoming shifts
        $myShifts = EmployeeShift::with('workSchedule')
            ->where('employee_id', $employee->id)
            ->where('date', '>=', $today)
            ->orderBy('date', 'asc')
            ->get();

        // 2. Colleague upcoming shifts
        $colleagueShifts = EmployeeShift::with(['employee.user', 'workSchedule'])
            ->where('employee_id', '!=', $employee->id)
            ->where('date', '>=', $today)
            ->orderBy('date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'my_shifts' => $myShifts,
            'colleague_shifts' => $colleagueShifts,
        ]);
    }

    /**
     * Create a shift exchange request.
     */
    public function store(Request $request): JsonResponse
    {
        $employee = Auth::user()->employee;
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Hanya karyawan yang dapat mengajukan tukar shift.'], 403);
        }

        $validated = $request->validate([
            'requester_shift_id' => 'required|exists:employee_shifts,id',
            'target_employee_id' => 'required|exists:employees,id|different:' . $employee->id,
            'target_shift_id' => 'required|exists:employee_shifts,id',
            'reason' => 'nullable|string|max:500',
        ]);

        $reqShift = EmployeeShift::findOrFail($validated['requester_shift_id']);
        if ($reqShift->employee_id !== $employee->id) {
            return response()->json(['success' => false, 'message' => 'Shift yang diajukan bukan milik Anda.'], 403);
        }

        $tgtShift = EmployeeShift::findOrFail($validated['target_shift_id']);
        if ($tgtShift->employee_id != $validated['target_employee_id']) {
            return response()->json(['success' => false, 'message' => 'Shift rekan kerja yang dipilih tidak sesuai.'], 422);
        }

        // Check if either shift is already locked in an active exchange
        $conflict = ShiftExchange::whereIn('status', ['pending_peer', 'pending_approval'])
            ->where(function ($q) use ($reqShift, $tgtShift) {
                $q->where('requester_shift_id', $reqShift->id)
                  ->orWhere('target_shift_id', $reqShift->id)
                  ->orWhere('requester_shift_id', $tgtShift->id)
                  ->orWhere('target_shift_id', $tgtShift->id);
            })
            ->exists();

        if ($conflict) {
            return response()->json(['success' => false, 'message' => 'Salah satu shift masih dalam proses pengajuan tukar shift lain.'], 422);
        }

        $exchange = ShiftExchange::create([
            'requester_id' => $employee->id,
            'requester_shift_id' => $reqShift->id,
            'target_employee_id' => $validated['target_employee_id'],
            'target_shift_id' => $tgtShift->id,
            'reason' => $validated['reason'] ?? null,
            'status' => 'pending_peer',
        ]);

        // Create in-app notification for colleague
        $targetUser = Employee::find($validated['target_employee_id'])?->user;
        if ($targetUser) {
            $targetUser->notify(new GenericNotification(
                'Permintaan Tukar Shift Masuk',
                Auth::user()->name . " mengajak tukar shift untuk tanggal {$reqShift->date} dengan shift Anda tanggal {$tgtShift->date}.",
                '/shift-exchanges',
                'info'
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan tukar shift berhasil dikirimkan ke rekan kerja.',
            'data' => $exchange->load(['requester.user', 'targetEmployee.user', 'requesterShift.workSchedule', 'targetShift.workSchedule']),
        ], 201);
    }

    /**
     * Peer response: Accept or reject the swap proposal.
     */
    public function peerRespond(Request $request, ShiftExchange $shiftExchange): JsonResponse
    {
        $employee = Auth::user()->employee;
        if (!$employee || $shiftExchange->target_employee_id !== $employee->id) {
            return response()->json(['success' => false, 'message' => 'Anda tidak berhak merespons permintaan ini.'], 403);
        }

        if ($shiftExchange->status !== 'pending_peer') {
            return response()->json(['success' => false, 'message' => 'Status pengajuan sudah tidak dapat diubah.'], 422);
        }

        $validated = $request->validate([
            'action' => 'required|in:accept,reject',
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        if ($validated['action'] === 'reject') {
            $shiftExchange->update([
                'status' => 'rejected',
                'rejection_reason' => $validated['rejection_reason'] ?? 'Ditolak oleh rekan kerja.',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Permintaan tukar shift berhasil ditolak.',
            ]);
        }

        // Accepted by peer -> moves to pending manager/HR approval
        $shiftExchange->update([
            'status' => 'pending_approval',
            'peer_approved_at' => Carbon::now(),
        ]);

        // Notify Requester
        $requesterUser = $shiftExchange->requester?->user;
        if ($requesterUser) {
            $requesterUser->notify(new GenericNotification(
                'Tukar Shift Disetujui Rekan',
                Auth::user()->name . ' telah menyetujui pertukaran shift. Menunggu persetujuan final dari Atasan / HR.',
                '/shift-exchanges',
                'info'
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Anda telah menyetujui tukar shift. Menunggu persetujuan Atasan / HR.',
            'data' => $shiftExchange,
        ]);
    }

    /**
     * Final Approval by Manager or HR.
     * When approved, atomically swaps the schedules between the two EmployeeShift records!
     */
    public function managerApprove(Request $request, ShiftExchange $shiftExchange): JsonResponse
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'hr', 'manager'])) {
            return response()->json(['success' => false, 'message' => 'Hanya Atasan atau HR yang dapat memberikan persetujuan final.'], 403);
        }

        if ($shiftExchange->status !== 'pending_approval') {
            return response()->json(['success' => false, 'message' => 'Pengajuan belum disetujui rekan kerja atau sudah diproses.'], 422);
        }

        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        if ($validated['action'] === 'reject') {
            $shiftExchange->update([
                'status' => 'rejected',
                'rejection_reason' => $validated['rejection_reason'] ?? 'Ditolak oleh Manajer / HR.',
                'approved_by' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pengajuan tukar shift telah ditolak.',
            ]);
        }

        // Atomic swap of workSchedule
        DB::beginTransaction();
        try {
            $reqShift = $shiftExchange->requesterShift;
            $tgtShift = $shiftExchange->targetShift;

            $tempScheduleId = $reqShift->work_schedule_id;
            $reqShift->update(['work_schedule_id' => $tgtShift->work_schedule_id]);
            $tgtShift->update(['work_schedule_id' => $tempScheduleId]);

            $shiftExchange->update([
                'status' => 'approved',
                'manager_approved_at' => Carbon::now(),
                'approved_by' => $user->id,
            ]);

            // Notify both employees
            $shiftExchange->requester?->user?->notify(new GenericNotification(
                'Tukar Shift Berhasil Disetujui!',
                'Jadwal shift Anda telah resmi ditukar oleh Manajemen.',
                '/shift-exchanges',
                'success'
            ));
            $shiftExchange->targetEmployee?->user?->notify(new GenericNotification(
                'Tukar Shift Berhasil Disetujui!',
                'Jadwal shift Anda telah resmi ditukar oleh Manajemen.',
                '/shift-exchanges',
                'success'
            ));

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tukar shift berhasil disetujui dan jadwal roster telah diperbarui secara otomatis!',
                'data' => $shiftExchange,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses tukar shift: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel an exchange request by requester.
     */
    public function cancel(ShiftExchange $shiftExchange): JsonResponse
    {
        $employee = Auth::user()->employee;
        if (!$employee || $shiftExchange->requester_id !== $employee->id) {
            return response()->json(['success' => false, 'message' => 'Tidak memiliki hak akses.'], 403);
        }

        if (!in_array($shiftExchange->status, ['pending_peer', 'pending_approval'])) {
            return response()->json(['success' => false, 'message' => 'Pengajuan sudah selesai dan tidak dapat dibatalkan.'], 422);
        }

        $shiftExchange->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan tukar shift berhasil dibatalkan.',
        ]);
    }
}
