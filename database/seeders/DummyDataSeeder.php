<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DummyDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = \Faker\Factory::create('id_ID');

        // Create some more employees to make the org chart look good
        $hrUser = \App\Models\User::where('role', 'hr')->first();
        $hrAdminId = $hrUser ? $hrUser->id : 1;

        $ceoUser = \App\Models\User::firstOrCreate(
            ['email' => 'ceo@gajihub.com'],
            ['name' => 'Budi Santoso (CEO)', 'password' => bcrypt('password'), 'role' => 'employee']
        );
        $ceoEmployee = \App\Models\Employee::firstOrCreate(
            ['user_id' => $ceoUser->id],
            ['employee_code' => 'EMP-CEO-01', 'position' => 'Chief Executive Officer', 'department' => 'Executive', 'basic_salary' => 50000000, 'join_date' => '2020-01-01', 'manager_id' => null]
        );

        $ctoUser = \App\Models\User::firstOrCreate(
            ['email' => 'cto@gajihub.com'],
            ['name' => 'Siti Aminah (CTO)', 'password' => bcrypt('password'), 'role' => 'employee']
        );
        $ctoEmployee = \App\Models\Employee::firstOrCreate(
            ['user_id' => $ctoUser->id],
            ['employee_code' => 'EMP-CTO-01', 'position' => 'Chief Technology Officer', 'department' => 'Executive', 'basic_salary' => 45000000, 'join_date' => '2020-02-01', 'manager_id' => $ceoEmployee->id]
        );

        $cmoUser = \App\Models\User::firstOrCreate(
            ['email' => 'cmo@gajihub.com'],
            ['name' => 'Andi Wijaya (CMO)', 'password' => bcrypt('password'), 'role' => 'employee']
        );
        $cmoEmployee = \App\Models\Employee::firstOrCreate(
            ['user_id' => $cmoUser->id],
            ['employee_code' => 'EMP-CMO-01', 'position' => 'Chief Marketing Officer', 'department' => 'Executive', 'basic_salary' => 40000000, 'join_date' => '2020-03-01', 'manager_id' => $ceoEmployee->id]
        );

        // Fetch all employees to seed data for them
        $employees = \App\Models\Employee::all();

        // 1. Assets
        $assetTypes = ['laptop', 'monitor', 'phone', 'vehicle', 'other'];
        foreach ($employees as $emp) {
            \App\Models\Asset::create([
                'name' => 'MacBook Pro M1 ' . $faker->year(),
                'type' => 'laptop',
                'serial_number' => strtoupper($faker->bothify('MBP-####-????')),
                'status' => 'borrowed',
                'employee_id' => $emp->id,
                'notes' => 'Aset operasional harian'
            ]);
            // Some available assets
            \App\Models\Asset::create([
                'name' => 'Monitor Dell 24"',
                'type' => 'monitor',
                'serial_number' => strtoupper($faker->bothify('DLL-####-????')),
                'status' => 'available',
                'employee_id' => null,
                'notes' => 'Tersedia di gudang IT'
            ]);
        }

        // 2. Loans
        foreach ($employees->take(3) as $emp) {
            $amount = $faker->randomElement([1000000, 2000000, 5000000, 10000000]);
            $duration = $faker->randomElement([3, 6, 12]);
            \App\Models\Loan::create([
                'employee_id' => $emp->id,
                'amount' => $amount,
                'duration_months' => $duration,
                'monthly_installment' => $amount / $duration,
                'remaining_amount' => $amount,
                'reason' => 'Kebutuhan mendesak: Renovasi rumah atau biaya sekolah',
                'status' => 'approved'
            ]);
        }

        // 3. Performance Reviews
        $currentMonth = date('n');
        $currentYear = date('Y');
        
        foreach ($employees as $emp) {
            \App\Models\PerformanceReview::create([
                'employee_id' => $emp->id,
                'reviewer_id' => $hrAdminId,
                'period_month' => $currentMonth,
                'period_year' => $currentYear,
                'score' => $faker->numberBetween(70, 95),
                'notes' => 'Kinerja baik bulan ini. Target tercapai dengan persentase di atas ekspektasi.'
            ]);
            
            \App\Models\PerformanceReview::create([
                'employee_id' => $emp->id,
                'reviewer_id' => $hrAdminId,
                'period_month' => $currentMonth - 1 <= 0 ? 12 : $currentMonth - 1,
                'period_year' => $currentMonth - 1 <= 0 ? $currentYear - 1 : $currentYear,
                'score' => $faker->numberBetween(65, 85),
                'notes' => 'Kinerja stabil. Perlu ditingkatkan dalam komunikasi tim.'
            ]);
        }
    }
}
