<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Bersihkan data lama agar fresh
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        \App\Models\Payroll::truncate();
        \App\Models\Reimbursement::truncate();
        \App\Models\Leave::truncate();
        \App\Models\Attendance::truncate();
        \App\Models\Employee::truncate();
        \App\Models\SalaryComponent::truncate();
        User::truncate();
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

        // 1. Create Admin
        $admin = User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'admin@gajihub.com',
            'role' => 'admin',
        ]);

        // 2. Create HR
        $hr = User::factory()->create([
            'name' => 'HR Manager',
            'email' => 'hr@gajihub.com',
            'role' => 'hr',
        ]);

        // 3. Create Employees
        $employees = [];
        for ($i = 1; $i <= 5; $i++) {
            $user = User::factory()->create([
                'name' => "Karyawan $i",
                'email' => "emp$i@gajihub.com",
                'role' => 'employee',
            ]);

            $emp = \App\Models\Employee::create([
                'user_id' => $user->id,
                'department_id' => ['IT', 'Finance', 'Marketing', 'Sales', 'HR'][$i-1],
                'employee_code' => "EMP-00$i",
                'basic_salary' => rand(5, 15) * 1000000,
                'join_date' => now()->subMonths(rand(6, 24))->format('Y-m-d'),
                'job_title' => ['Staff', 'Supervisor', 'Manager', 'Developer', 'Analyst'][$i-1],
                'employment_status' => ['permanent', 'contract', 'permanent', 'probation', 'permanent'][$i-1],
                'bank_name' => 'BCA',
                'bank_account' => '123456789' . $i,
                'npwp_number' => '12.345.678.9-00' . $i . '.000',
                'bpjs_kesehatan' => '00012345678' . $i,
                'bpjs_ketenagakerjaan' => '00098765432' . $i,
                'phone' => '08123456789' . $i,
                'address' => 'Jl. Sudirman No. ' . $i . ', Jakarta',
                'annual_leave_quota' => 12,
                'tax_status' => ['TK/0', 'TK/1', 'K/0', 'K/1', 'TK/0'][$i-1],
                'manager_id' => $i > 1 ? $employees[0]->id : null,
            ]);
            $employees[] = $emp;
        }

        // 4. Create Salary Components (Master)
        \App\Models\SalaryComponent::create(['name' => 'Tunjangan Transport', 'type' => 'allowance', 'default_amount' => 500000]);
        \App\Models\SalaryComponent::create(['name' => 'BPJS Kesehatan', 'type' => 'deduction', 'default_amount' => 150000]);
        \App\Models\SalaryComponent::create(['name' => 'PPH 21', 'type' => 'deduction', 'default_amount' => 200000]);

        // 5. Generate Data for the current month
        $currentMonth = date('n');
        $currentYear = date('Y');

        foreach ($employees as $idx => $emp) {
            // A. Attendances (last 10 days)
            for ($d = 1; $d <= 10; $d++) {
                \App\Models\Attendance::create([
                    'employee_id' => $emp->id,
                    'date' => date('Y-m-d', strtotime("-$d days")),
                    'status' => (rand(1, 10) > 2) ? 'present' : 'absent',
                    'clock_in' => '08:00:00',
                    'clock_out' => '17:00:00',
                ]);
            }

            // B. Leaves
            $leaveStatus = ['pending', 'approved', 'rejected'][rand(0, 2)];
            \App\Models\Leave::create([
                'employee_id' => $emp->id,
                'type' => 'annual',
                'start_date' => date('Y-m-d', strtotime('+'.rand(1,5).' days')),
                'end_date' => date('Y-m-d', strtotime('+'.rand(6,10).' days')),
                'reason' => 'Liburan keluarga',
                'status' => $leaveStatus
            ]);

            // C. Reimbursements
            $reimbStatus = ['pending_manager', 'pending_hr', 'approved', 'rejected'][rand(0, 3)];
            \App\Models\Reimbursement::create([
                'employee_id' => $emp->id,
                'date' => date('Y-m-d', strtotime('-'.rand(1,5).' days')),
                'description' => 'Biaya Bensin Kunjungan Klien',
                'amount' => rand(1, 5) * 50000,
                'status' => $reimbStatus
            ]);
            
            // D. Overtime
            $otStatus = ['pending_manager', 'pending_hr', 'approved', 'rejected'][rand(0, 3)];
            \App\Models\Overtime::create([
                'employee_id' => $emp->id,
                'date' => date('Y-m-d', strtotime('-'.rand(1,5).' days')),
                'start_time' => '17:00:00',
                'end_time' => '20:00:00',
                'duration_hours' => 3,
                'reason' => 'Kejar tayang rilis aplikasi',
                'status' => $otStatus
            ]);

            // E. Employee Documents
            \App\Models\EmployeeDocument::create([
                'employee_id' => $emp->id,
                'title' => 'KTP Karyawan',
                'file_path' => '/storage/employee_documents/dummy_ktp.jpg',
                'file_type' => 'jpg'
            ]);
            
            // D. Payroll for last month
            \App\Models\Payroll::create([
                'employee_id' => $emp->id,
                'period_month' => $currentMonth == 1 ? 12 : $currentMonth - 1,
                'period_year' => $currentMonth == 1 ? $currentYear - 1 : $currentYear,
                'total_basic' => $emp->basic_salary,
                'total_allowance' => 500000,
                'total_deduction' => 350000,
                'net_salary' => $emp->basic_salary + 150000,
                'status' => 'paid',
            ]);
        }
    }
}
