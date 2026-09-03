<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Employee;
use App\Models\User;
use App\Http\Requests\EmployeeRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class EmployeeController extends Controller
{
    public function index()
    {
        $now = \Carbon\Carbon::now();
        $employees = Employee::with('user')->get()->map(function($emp) use ($now) {
            $joinDate = $emp->join_date ? \Carbon\Carbon::parse($emp->join_date) : null;
            $contractEndDate = null;
            $daysRemaining = null;
            $isExpiringSoon = false;

            if ($joinDate && in_array($emp->employment_status, ['contract', 'probation'])) {
                if ($emp->employment_status === 'probation') {
                    $contractEndDate = $joinDate->copy()->addMonths(3);
                } else {
                    $contractEndDate = $joinDate->copy()->addYear();
                    while ($contractEndDate->isPast() && $contractEndDate->diffInDays($now) > 365) {
                        $contractEndDate->addYear();
                    }
                }

                $daysRemaining = (int) $now->diffInDays($contractEndDate, false);
                if ($daysRemaining >= 0 && $daysRemaining <= 30) {
                    $isExpiringSoon = true;
                }
            }

            $emp->contract_end_date = $contractEndDate ? $contractEndDate->format('Y-m-d') : null;
            $emp->days_remaining = $daysRemaining;
            $emp->is_expiring_soon = $isExpiringSoon;

            return $emp;
        });

        $expiringCount = $employees->where('is_expiring_soon', true)->count();

        return response()->json([
            'success' => true,
            'data' => $employees,
            'expiring_count' => $expiringCount
        ]);
    }

    public function store(EmployeeRequest $request)
    {
        DB::beginTransaction();
        try {
            $role = $request->role ?? 'employee';
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make('password123'), // Default password
                'role' => $role
            ]);
            
            $user->assignRole($role);

            $employee = Employee::create([
                'user_id' => $user->id,
                'department_id' => $request->department_id,
                'employee_code' => $request->employee_code,
                'basic_salary' => $request->basic_salary,
                'join_date' => $request->join_date,
                'job_title' => $request->job_title,
                'employment_status' => $request->employment_status,
                'bank_name' => $request->bank_name,
                'bank_account' => $request->bank_account,
                'npwp_number' => $request->npwp_number,
                'bpjs_kesehatan' => $request->bpjs_kesehatan,
                'bpjs_ketenagakerjaan' => $request->bpjs_ketenagakerjaan,
                'phone' => $request->phone,
                'address' => $request->address,
                'annual_leave_quota' => $request->annual_leave_quota ?? 12,
                'manager_id' => $request->manager_id,
                'tax_status' => $request->tax_status ?? 'TK/0',
                'resign_date' => $request->resign_date,
                'termination_reason' => $request->termination_reason,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Karyawan berhasil ditambahkan.',
                'data' => $employee->load('user')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function update(EmployeeRequest $request, $id)
    {
        DB::beginTransaction();
        try {
            $employee = Employee::findOrFail($id);
            $user = $employee->user;

            $role = $request->role ?? $user->role;
            $user->update([
                'name' => $request->name,
                'email' => $request->email,
                'role' => $role
            ]);
            
            $user->syncRoles([$role]);

            $employee->update([
                'department_id' => $request->department_id,
                'employee_code' => $request->employee_code,
                'basic_salary' => $request->basic_salary,
                'join_date' => $request->join_date,
                'job_title' => $request->job_title,
                'employment_status' => $request->employment_status,
                'bank_name' => $request->bank_name,
                'bank_account' => $request->bank_account,
                'npwp_number' => $request->npwp_number,
                'bpjs_kesehatan' => $request->bpjs_kesehatan,
                'bpjs_ketenagakerjaan' => $request->bpjs_ketenagakerjaan,
                'phone' => $request->phone,
                'address' => $request->address,
                'manager_id' => $request->manager_id,
                'tax_status' => $request->tax_status ?? 'TK/0',
                'resign_date' => $request->resign_date,
                'termination_reason' => $request->termination_reason,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data karyawan berhasil diubah.',
                'data' => $employee->load('user')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $employee = Employee::findOrFail($id);
            $user = $employee->user;
            
            $employee->delete();
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'Data karyawan berhasil dihapus.'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function downloadTemplate()
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="template_import_karyawan.csv"',
        ];

        $callback = function () {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['Nama', 'Email', 'NIK_Karyawan', 'Departemen', 'Jabatan', 'Gaji_Pokok', 'Tanggal_Masuk', 'Status_Karyawan', 'No_HP']);
            fputcsv($handle, ['Ahmad Pratama', 'ahmad.pratama@example.com', 'EMP-001', 'Technology', 'Backend Developer', '8500000', '2025-01-10', 'permanent', '081234567890']);
            fputcsv($handle, ['Siti Rahma', 'siti.rahma@example.com', 'EMP-002', 'Human Resources', 'HR Specialist', '7000000', '2025-02-01', 'contract', '081298765432']);
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function importCsv(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120'
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');
        
        $header = fgetcsv($handle);

        $imported = 0;
        $skipped = 0;

        DB::beginTransaction();
        try {
            while (($row = fgetcsv($handle, 1000, ',')) !== false) {
                if (count($row) < 5 || empty(trim($row[0])) || empty(trim($row[1]))) {
                    continue;
                }

                $name = trim($row[0]);
                $email = trim($row[1]);
                $code = trim($row[2] ?? '');
                $department = trim($row[3] ?? 'General');
                $jobTitle = trim($row[4] ?? 'Staff');
                $basicSalary = floatval(preg_replace('/[^0-9]/', '', $row[5] ?? '5000000')) ?: 5000000;
                $joinDate = !empty(trim($row[6] ?? '')) ? trim($row[6]) : \Carbon\Carbon::today()->toDateString();
                $employmentStatus = in_array(strtolower(trim($row[7] ?? '')), ['permanent', 'contract', 'probation']) ? strtolower(trim($row[7])) : 'permanent';
                $phone = trim($row[8] ?? '');

                if (User::where('email', $email)->exists() || (!empty($code) && Employee::where('employee_code', $code)->exists())) {
                    $skipped++;
                    continue;
                }

                if (empty($code)) {
                    $code = 'EMP-' . strtoupper(substr(uniqid(), -5));
                }

                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make('password123'),
                    'role' => 'employee'
                ]);
                $user->assignRole('employee');

                Employee::create([
                    'user_id' => $user->id,
                    'department_id' => $department,
                    'employee_code' => $code,
                    'basic_salary' => $basicSalary,
                    'join_date' => $joinDate,
                    'job_title' => $jobTitle,
                    'employment_status' => $employmentStatus,
                    'phone' => $phone,
                    'annual_leave_quota' => 12,
                    'tax_status' => 'TK/0'
                ]);

                $imported++;
            }

            DB::commit();
            fclose($handle);

            return response()->json([
                'success' => true,
                'message' => "Proses import selesai: {$imported} karyawan berhasil ditambahkan, {$skipped} dilewati (duplikat email/NIK)."
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            if (is_resource($handle)) fclose($handle);
            return response()->json(['success' => false, 'message' => 'Gagal membaca berkas CSV: ' . $e->getMessage()], 500);
        }
    }
}
