<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApprovalWorkflow;
use Illuminate\Http\Request;

class ApprovalWorkflowController extends Controller
{
    public function index(Request $request)
    {
        ApprovalWorkflow::seedDefaultsIfEmpty();

        $query = ApprovalWorkflow::orderBy('module')->orderBy('min_amount');

        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        $workflows = $query->get();

        return response()->json([
            'success' => true,
            'data' => $workflows,
            'available_roles' => [
                ['id' => 'direct_manager', 'label' => 'Atasan Langsung (Direct Manager)'],
                ['id' => 'department_head', 'label' => 'Kepala Divisi (Head of Department)'],
                ['id' => 'hr', 'label' => 'HR Department / HR Admin'],
                ['id' => 'finance', 'label' => 'Finance & Accounting'],
                ['id' => 'director', 'label' => 'Direktur / Top Management'],
            ],
            'modules' => [
                ['id' => 'leave', 'label' => 'Pengajuan Cuti'],
                ['id' => 'overtime', 'label' => 'Pengajuan Lembur'],
                ['id' => 'reimbursement', 'label' => 'Klaim Biaya (Reimbursement)'],
                ['id' => 'cash_advance', 'label' => 'Kasbon Karyawan'],
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'module' => 'required|in:leave,overtime,reimbursement,cash_advance',
            'name' => 'required|string|max:255',
            'min_amount' => 'nullable|numeric|min:0',
            'max_amount' => 'nullable|numeric|min:0',
            'tiers' => 'required|array|min:1',
            'tiers.*.level' => 'required|integer',
            'tiers.*.role' => 'required|string',
            'tiers.*.label' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $workflow = ApprovalWorkflow::create([
            'module' => $request->module,
            'name' => $request->name,
            'min_amount' => $request->input('min_amount', 0),
            'max_amount' => $request->max_amount ?: null,
            'tiers' => $request->tiers,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Alur persetujuan bertingkat berhasil dibuat.',
            'data' => $workflow,
        ]);
    }

    public function update(Request $request, $id)
    {
        $workflow = ApprovalWorkflow::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'min_amount' => 'nullable|numeric|min:0',
            'max_amount' => 'nullable|numeric|min:0',
            'tiers' => 'sometimes|array|min:1',
            'tiers.*.level' => 'sometimes|integer',
            'tiers.*.role' => 'sometimes|string',
            'tiers.*.label' => 'sometimes|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $workflow->update($request->only([
            'name', 'min_amount', 'max_amount', 'tiers', 'is_active'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Alur persetujuan berhasil diperbarui.',
            'data' => $workflow,
        ]);
    }

    public function destroy($id)
    {
        $workflow = ApprovalWorkflow::findOrFail($id);
        $workflow->delete();

        return response()->json([
            'success' => true,
            'message' => 'Alur persetujuan berhasil dihapus.',
        ]);
    }

    public function preview(Request $request)
    {
        $request->validate([
            'module' => 'required|string',
            'amount' => 'nullable|numeric',
        ]);

        $workflow = ApprovalWorkflow::getWorkflowFor($request->module, (float) ($request->amount ?? 0));

        return response()->json([
            'success' => true,
            'data' => $workflow,
        ]);
    }
}
