<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\CompanySetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BranchController extends Controller
{
    /**
     * Display a listing of the branches.
     */
    public function index(Request $request): JsonResponse
    {
        // Auto-seed default head office if table is empty
        if (Branch::count() === 0) {
            $settings = CompanySetting::all()->pluck('value', 'key');
            $defaultLat = (float) ($settings['office_latitude'] ?? -6.1515954);
            $defaultLng = (float) ($settings['office_longitude'] ?? 106.7765215);
            $defaultRadius = (int) ($settings['office_radius'] ?? 100);
            $companyName = $settings['company_name'] ?? 'Head Office (Kantor Pusat)';

            $headOffice = Branch::create([
                'name' => $companyName,
                'code' => 'HQ-01',
                'address' => $settings['company_address'] ?? 'Jakarta Pusat, DKI Jakarta',
                'latitude' => $defaultLat,
                'longitude' => $defaultLng,
                'radius_meters' => $defaultRadius,
                'is_head_office' => true,
                'is_active' => true,
            ]);

            // Assign unassigned employees to this head office
            Employee::whereNull('branch_id')->update(['branch_id' => $headOffice->id]);
        }

        $query = Branch::withCount('employees')
            ->orderBy('is_head_office', 'desc')
            ->orderBy('name', 'asc');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%");
            });
        }

        $branches = $query->get();

        return response()->json([
            'success' => true,
            'data' => $branches,
            'total' => $branches->count(),
        ]);
    }

    /**
     * Store a newly created branch.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:branches,code',
            'address' => 'nullable|string',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius_meters' => 'required|integer|min:10|max:50000',
            'is_head_office' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        DB::beginTransaction();
        try {
            if (!empty($validated['is_head_office'])) {
                Branch::where('is_head_office', true)->update(['is_head_office' => false]);
            }

            $branch = Branch::create([
                'name' => $validated['name'],
                'code' => strtoupper($validated['code']),
                'address' => $validated['address'] ?? null,
                'latitude' => (float) $validated['latitude'],
                'longitude' => (float) $validated['longitude'],
                'radius_meters' => (int) $validated['radius_meters'],
                'is_head_office' => (bool) ($validated['is_head_office'] ?? false),
                'is_active' => isset($validated['is_active']) ? (bool) $validated['is_active'] : true,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Cabang kantor baru berhasil ditambahkan.',
                'data' => $branch->loadCount('employees'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan cabang: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified branch.
     */
    public function show(Branch $branch): JsonResponse
    {
        $branch->load(['employees.user']);

        return response()->json([
            'success' => true,
            'data' => $branch,
        ]);
    }

    /**
     * Update the specified branch.
     */
    public function update(Request $request, Branch $branch): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:branches,code,' . $branch->id,
            'address' => 'nullable|string',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius_meters' => 'required|integer|min:10|max:50000',
            'is_head_office' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        DB::beginTransaction();
        try {
            if (!empty($validated['is_head_office']) && !$branch->is_head_office) {
                Branch::where('id', '!=', $branch->id)->where('is_head_office', true)->update(['is_head_office' => false]);
            }

            $branch->update([
                'name' => $validated['name'],
                'code' => strtoupper($validated['code']),
                'address' => $validated['address'] ?? null,
                'latitude' => (float) $validated['latitude'],
                'longitude' => (float) $validated['longitude'],
                'radius_meters' => (int) $validated['radius_meters'],
                'is_head_office' => (bool) ($validated['is_head_office'] ?? $branch->is_head_office),
                'is_active' => isset($validated['is_active']) ? (bool) $validated['is_active'] : $branch->is_active,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data cabang kantor berhasil diperbarui.',
                'data' => $branch->loadCount('employees'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui cabang: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified branch.
     */
    public function destroy(Branch $branch): JsonResponse
    {
        if ($branch->is_head_office) {
            return response()->json([
                'success' => false,
                'message' => 'Kantor Pusat tidak dapat dihapus. Silakan tentukan Kantor Pusat lain terlebih dahulu.',
            ], 422);
        }

        // Unassign employees
        Employee::where('branch_id', $branch->id)->update(['branch_id' => null]);

        $branch->delete();

        return response()->json([
            'success' => true,
            'message' => 'Cabang kantor berhasil dihapus.',
        ]);
    }

    /**
     * Bulk assign employees to a branch.
     */
    public function assignEmployees(Request $request, Branch $branch): JsonResponse
    {
        $validated = $request->validate([
            'employee_ids' => 'required|array',
            'employee_ids.*' => 'exists:employees,id',
        ]);

        Employee::whereIn('id', $validated['employee_ids'])->update([
            'branch_id' => $branch->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => count($validated['employee_ids']) . ' karyawan berhasil dialokasikan ke cabang ' . $branch->name,
            'data' => $branch->loadCount('employees'),
        ]);
    }
}
