<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Employee;
use App\Models\Payroll;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PayrollTest extends TestCase
{
    use RefreshDatabase;

    protected User $hrUser;
    protected User $employeeUser;
    protected Employee $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->artisan('db:seed', ['--class' => 'Database\\Seeders\\RolesAndPermissionsSeeder']);

        $this->hrUser = User::factory()->create(['role' => 'hr']);
        $this->employeeUser = User::factory()->create(['role' => 'employee']);
        $this->employee = Employee::factory()->create([
            'user_id' => $this->employeeUser->id,
            'basic_salary' => 10000000,
            'employment_status' => 'permanent',
        ]);
    }

    /** @test */
    public function hr_can_generate_payroll(): void
    {
        $response = $this->actingAs($this->hrUser)->postJson('/api/v1/payrolls/generate', [
            'month' => now()->month,
            'year' => now()->year,
        ]);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('payrolls', [
            'employee_id' => $this->employee->id,
            'period_month' => now()->month,
            'period_year' => now()->year,
            'status' => 'draft',
        ]);
    }

    /** @test */
    public function employee_cannot_generate_payroll(): void
    {
        $response = $this->actingAs($this->employeeUser)->postJson('/api/v1/payrolls/generate', [
            'month' => now()->month,
            'year' => now()->year,
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function duplicate_approved_payroll_is_rejected(): void
    {
        // Create approved payroll
        Payroll::factory()->create([
            'employee_id' => $this->employee->id,
            'period_month' => 6,
            'period_year' => 2026,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->hrUser)->postJson('/api/v1/payrolls/generate', [
            'month' => 6,
            'year' => 2026,
        ]);

        $response->assertStatus(400)
                 ->assertJson(['success' => false]);
    }

    /** @test */
    public function resigned_employees_excluded_from_payroll(): void
    {
        // Create resigned employee
        $resignedUser = User::factory()->create(['role' => 'employee']);
        Employee::factory()->resigned()->create([
            'user_id' => $resignedUser->id,
        ]);

        $response = $this->actingAs($this->hrUser)->postJson('/api/v1/payrolls/generate', [
            'month' => now()->month,
            'year' => now()->year,
        ]);

        $response->assertStatus(200);

        // Only the active employee should have payroll
        $this->assertEquals(1, Payroll::count());
    }

    /** @test */
    public function hr_can_approve_draft_payroll(): void
    {
        $payroll = Payroll::factory()->create([
            'employee_id' => $this->employee->id,
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->hrUser)->postJson("/api/v1/payrolls/{$payroll->id}/approve");

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('payrolls', [
            'id' => $payroll->id,
            'status' => 'approved',
        ]);
    }

    /** @test */
    public function cannot_approve_non_draft_payroll(): void
    {
        $payroll = Payroll::factory()->create([
            'employee_id' => $this->employee->id,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->hrUser)->postJson("/api/v1/payrolls/{$payroll->id}/approve");

        $response->assertStatus(400);
    }

    /** @test */
    public function payroll_generate_validates_required_fields(): void
    {
        $response = $this->actingAs($this->hrUser)->postJson('/api/v1/payrolls/generate', []);

        $response->assertStatus(422);
    }

    /** @test */
    public function employee_can_view_own_payslip(): void
    {
        $payroll = Payroll::factory()->create([
            'employee_id' => $this->employee->id,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->employeeUser)->getJson("/api/v1/payrolls/{$payroll->id}");

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);
    }

    /** @test */
    public function employee_cannot_view_other_payslip(): void
    {
        $otherUser = User::factory()->create(['role' => 'employee']);
        $otherEmployee = Employee::factory()->create(['user_id' => $otherUser->id]);
        
        $payroll = Payroll::factory()->create([
            'employee_id' => $otherEmployee->id,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->employeeUser)->getJson("/api/v1/payrolls/{$payroll->id}");

        $response->assertStatus(403);
    }
}
