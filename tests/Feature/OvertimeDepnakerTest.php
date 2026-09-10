<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Holiday;
use App\Models\Overtime;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OvertimeDepnakerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $employeeUser;
    private Employee $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);

        $this->employeeUser = User::factory()->create(['role' => 'employee']);
        $this->employee = Employee::create([
            'user_id' => $this->employeeUser->id,
            'employee_code' => 'EMP-001',
            'basic_salary' => 5190000, // 5.190.000 / 173 = 30.000 per hour
            'join_date' => '2023-01-01',
            'employment_status' => 'permanent',
        ]);
    }

    public function test_workday_overtime_calculation_follows_pp_35_2021(): void
    {
        // Hari kerja biasa (misal: Rabu 2026-09-09)
        $date = '2026-09-09';
        $durationHours = 3.0; // 1 jam pertama 1.5x (1.5), 2 jam berikutnya 2.0x (4.0) -> total 5.5 jam pengali

        $calc = Overtime::calculateDepnaker($this->employee, $date, $durationHours, 'workday');

        $this->assertEquals('workday', $calc['day_type']);
        $this->assertEquals(30000, $calc['hourly_rate']);
        $this->assertEquals(3.0, $calc['duration_hours']);
        $this->assertEquals(5.5, $calc['multiplier_hours']);
        $this->assertEquals(165000, $calc['total_pay']); // 5.5 * 30000
        $this->assertCount(2, $calc['breakdown']);
    }

    public function test_holiday_overtime_calculation_follows_pp_35_2021(): void
    {
        // Hari libur / weekend (misal: Minggu 2026-09-13)
        $date = '2026-09-13';
        $durationHours = 9.0; // Jam 1-8: 8 * 2.0 = 16.0; Jam 9: 1 * 3.0 = 3.0 -> total 19.0 jam pengali

        $calc = Overtime::calculateDepnaker($this->employee, $date, $durationHours);

        $this->assertEquals('holiday', $calc['day_type']);
        $this->assertTrue($calc['is_weekend']);
        $this->assertEquals(30000, $calc['hourly_rate']);
        $this->assertEquals(19.0, $calc['multiplier_hours']);
        $this->assertEquals(570000, $calc['total_pay']); // 19.0 * 30000
        $this->assertCount(2, $calc['breakdown']);
    }

    public function test_api_overtimes_calculate_returns_accurate_preview(): void
    {
        $response = $this->actingAs($this->employeeUser)
            ->postJson('/api/v1/overtimes/calculate', [
                'date' => '2026-09-09',
                'start_time' => '17:00',
                'end_time' => '19:00', // 2 jam
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.duration_hours', 2)
            ->assertJsonPath('data.multiplier_hours', 3.5) // 1.5 + 2.0 = 3.5
            ->assertJsonPath('data.total_pay', 105000); // 3.5 * 30000
    }

    public function test_employee_can_submit_overtime_with_automatic_depnaker_metrics(): void
    {
        $response = $this->actingAs($this->employeeUser)
            ->postJson('/api/v1/overtimes', [
                'date' => '2026-09-09',
                'start_time' => '17:00',
                'end_time' => '20:00', // 3 jam
                'reason' => 'Sprint finalization & deployment',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('overtimes', [
            'employee_id' => $this->employee->id,
            'duration_hours' => 3.0,
            'day_type' => 'workday',
            'hourly_rate' => 30000,
            'multiplier_hours' => 5.5,
            'total_pay' => 165000,
        ]);
    }

    public function test_approved_overtime_is_integrated_into_payroll_generation(): void
    {
        // Buat overtime yang approved bulan September 2026
        Overtime::create([
            'employee_id' => $this->employee->id,
            'date' => '2026-09-05',
            'start_time' => '17:00',
            'end_time' => '20:00',
            'duration_hours' => 3.0,
            'day_type' => 'workday',
            'hourly_rate' => 30000,
            'multiplier_hours' => 5.5,
            'total_pay' => 165000,
            'reason' => 'Monthly closing',
            'status' => 'approved',
        ]);

        // Generate payroll oleh Admin
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/payrolls/generate', [
                'month' => 9,
                'year' => 2026,
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('payrolls', [
            'employee_id' => $this->employee->id,
            'period_month' => 9,
            'period_year' => 2026,
        ]);

        $payroll = \App\Models\Payroll::where('employee_id', $this->employee->id)->first();
        $this->assertNotNull($payroll);
        $details = is_array($payroll->details) ? $payroll->details : json_decode($payroll->details, true);
        $this->assertEquals(165000, $details['allowances']['overtime']);
        $this->assertEquals(3.0, $details['allowances']['overtime_hours']);
        $this->assertEquals(5.5, $details['allowances']['overtime_multiplier_hours']);
    }
}

