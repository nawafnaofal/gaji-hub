<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Employee;
use App\Models\Leave;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveTest extends TestCase
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
            'annual_leave_quota' => 12,
        ]);
    }

    /** @test */
    public function employee_can_submit_leave_request(): void
    {
        $response = $this->actingAs($this->employeeUser)->postJson('/api/v1/leaves', [
            'type' => 'annual',
            'start_date' => now()->addDays(5)->toDateString(),
            'end_date' => now()->addDays(7)->toDateString(),
            'reason' => 'Liburan keluarga',
        ]);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);
        
        $this->assertDatabaseHas('leaves', [
            'employee_id' => $this->employee->id,
            'type' => 'annual',
            'reason' => 'Liburan keluarga',
        ]);
    }

    /** @test */
    public function leave_request_rejected_when_dates_overlap(): void
    {
        // First leave
        Leave::factory()->create([
            'employee_id' => $this->employee->id,
            'start_date' => now()->addDays(5)->toDateString(),
            'end_date' => now()->addDays(7)->toDateString(),
            'status' => 'pending_hr',
            'type' => 'annual',
        ]);

        // Overlapping leave
        $response = $this->actingAs($this->employeeUser)->postJson('/api/v1/leaves', [
            'type' => 'annual',
            'start_date' => now()->addDays(6)->toDateString(),
            'end_date' => now()->addDays(8)->toDateString(),
            'reason' => 'Overlap test',
        ]);

        $response->assertStatus(400)
                 ->assertJson(['success' => false]);
    }

    /** @test */
    public function leave_validation_rejects_past_dates(): void
    {
        $response = $this->actingAs($this->employeeUser)->postJson('/api/v1/leaves', [
            'type' => 'annual',
            'start_date' => now()->subDays(3)->toDateString(),
            'end_date' => now()->subDays(1)->toDateString(),
            'reason' => 'Past date test',
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function leave_validation_rejects_invalid_type(): void
    {
        $response = $this->actingAs($this->employeeUser)->postJson('/api/v1/leaves', [
            'type' => 'invalid_type',
            'start_date' => now()->addDays(5)->toDateString(),
            'end_date' => now()->addDays(7)->toDateString(),
            'reason' => 'Invalid type test',
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function hr_can_approve_leave(): void
    {
        $leave = Leave::factory()->create([
            'employee_id' => $this->employee->id,
            'start_date' => now()->addDays(5)->toDateString(),
            'end_date' => now()->addDays(5)->toDateString(),
            'status' => 'pending_hr',
            'type' => 'annual',
        ]);

        $response = $this->actingAs($this->hrUser)->putJson("/api/v1/leaves/{$leave->id}", [
            'status' => 'approved',
        ]);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('leaves', [
            'id' => $leave->id,
            'status' => 'approved',
        ]);
    }

    /** @test */
    public function hr_can_reject_leave(): void
    {
        $leave = Leave::factory()->create([
            'employee_id' => $this->employee->id,
            'start_date' => now()->addDays(5)->toDateString(),
            'end_date' => now()->addDays(5)->toDateString(),
            'status' => 'pending_hr',
            'type' => 'annual',
        ]);

        $response = $this->actingAs($this->hrUser)->putJson("/api/v1/leaves/{$leave->id}", [
            'status' => 'rejected',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('leaves', [
            'id' => $leave->id,
            'status' => 'rejected',
        ]);
    }

    /** @test */
    public function employee_can_view_own_leaves(): void
    {
        Leave::factory()->count(3)->create([
            'employee_id' => $this->employee->id,
            'type' => 'annual',
        ]);

        $response = $this->actingAs($this->employeeUser)->getJson('/api/v1/leaves');

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);
    }
}
