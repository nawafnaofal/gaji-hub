<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Employee;
use App\Models\WorkSchedule;
use App\Models\EmployeeShift;
use App\Models\ShiftExchange;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class ShiftExchangeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'Database\\Seeders\\RolesAndPermissionsSeeder']);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function full_shift_exchange_lifecycle_works_and_swaps_roster(): void
    {
        // 1. Setup Schedules
        $morningSchedule = WorkSchedule::create([
            'name' => 'Shift Pagi',
            'clock_in_time' => '07:00:00',
            'clock_out_time' => '15:00:00',
            'work_days' => [1, 2, 3, 4, 5],
            'is_active' => true,
        ]);

        $nightSchedule = WorkSchedule::create([
            'name' => 'Shift Malam',
            'clock_in_time' => '23:00:00',
            'clock_out_time' => '07:00:00',
            'work_days' => [1, 2, 3, 4, 5],
            'is_active' => true,
        ]);

        // 2. Setup Employees
        $userA = User::factory()->create(['role' => 'employee']);
        $empA = Employee::factory()->create(['user_id' => $userA->id]);

        $userB = User::factory()->create(['role' => 'employee']);
        $empB = Employee::factory()->create(['user_id' => $userB->id]);

        $hrUser = User::factory()->create(['role' => 'hr']);
        Employee::factory()->create(['user_id' => $hrUser->id]);

        $targetDate = Carbon::tomorrow()->format('Y-m-d');

        // Emp A has Morning Shift
        $shiftA = EmployeeShift::create([
            'employee_id' => $empA->id,
            'work_schedule_id' => $morningSchedule->id,
            'date' => $targetDate,
        ]);

        // Emp B has Night Shift
        $shiftB = EmployeeShift::create([
            'employee_id' => $empB->id,
            'work_schedule_id' => $nightSchedule->id,
            'date' => $targetDate,
        ]);

        // STEP 1: Emp A proposes exchange with Emp B
        $proposeRes = $this->actingAs($userA)->postJson('/api/v1/shift-exchanges', [
            'requester_shift_id' => $shiftA->id,
            'target_employee_id' => $empB->id,
            'target_shift_id' => $shiftB->id,
            'reason' => 'Tukar shift untuk jaga anak sakit',
        ]);

        $proposeRes->assertStatus(201);
        $exchangeId = $proposeRes->json('data.id');

        $exchange = ShiftExchange::find($exchangeId);
        $this->assertNotNull($exchange);
        $this->assertEquals('pending_peer', $exchange->status);

        // STEP 2: Emp B accepts the exchange
        $acceptRes = $this->actingAs($userB)->putJson("/api/v1/shift-exchanges/{$exchangeId}/peer-respond", [
            'action' => 'accept',
        ]);

        $acceptRes->assertStatus(200);
        $this->assertEquals('pending_approval', $exchange->fresh()->status);
        $this->assertNotNull($exchange->fresh()->peer_approved_at);

        // STEP 3: HR approves the exchange
        $approveRes = $this->actingAs($hrUser)->putJson("/api/v1/shift-exchanges/{$exchangeId}/manager-approve", [
            'action' => 'approve',
        ]);

        $approveRes->assertStatus(200);
        $this->assertEquals('approved', $exchange->fresh()->status);
        $this->assertNotNull($exchange->fresh()->manager_approved_at);

        // VERIFY: The shifts have been swapped!
        // Emp A now has the Night Schedule
        $this->assertEquals($nightSchedule->id, $shiftA->fresh()->work_schedule_id);
        // Emp B now has the Morning Schedule
        $this->assertEquals($morningSchedule->id, $shiftB->fresh()->work_schedule_id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function colleague_can_reject_shift_exchange_proposal(): void
    {
        $schedule = WorkSchedule::create([
            'name' => 'General',
            'clock_in_time' => '08:00:00',
            'clock_out_time' => '17:00:00',
            'work_days' => [1],
            'is_active' => true,
        ]);

        $userA = User::factory()->create(['role' => 'employee']);
        $empA = Employee::factory()->create(['user_id' => $userA->id]);

        $userB = User::factory()->create(['role' => 'employee']);
        $empB = Employee::factory()->create(['user_id' => $userB->id]);

        $shiftA = EmployeeShift::create(['employee_id' => $empA->id, 'work_schedule_id' => $schedule->id, 'date' => '2026-10-01']);
        $shiftB = EmployeeShift::create(['employee_id' => $empB->id, 'work_schedule_id' => $schedule->id, 'date' => '2026-10-02']);

        $exchange = ShiftExchange::create([
            'requester_id' => $empA->id,
            'requester_shift_id' => $shiftA->id,
            'target_employee_id' => $empB->id,
            'target_shift_id' => $shiftB->id,
            'status' => 'pending_peer',
        ]);

        // Emp B rejects
        $res = $this->actingAs($userB)->putJson("/api/v1/shift-exchanges/{$exchange->id}/peer-respond", [
            'action' => 'reject',
            'rejection_reason' => 'Sedang ada acara keluarga di tanggal tersebut.',
        ]);

        $res->assertStatus(200);
        $this->assertEquals('rejected', $exchange->fresh()->status);
        $this->assertEquals('Sedang ada acara keluarga di tanggal tersebut.', $exchange->fresh()->rejection_reason);
    }
}
