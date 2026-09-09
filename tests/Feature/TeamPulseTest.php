<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Employee;
use App\Models\Leave;
use App\Models\Holiday;
use App\Models\Attendance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;
use Tests\TestCase;

class TeamPulseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'Database\\Seeders\\RolesAndPermissionsSeeder']);
    }

    /** @test */
    public function dashboard_stats_returns_team_pulse_and_geofencing(): void
    {
        $user = User::factory()->create(['role' => 'employee']);
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        $otherUser = User::factory()->create(['role' => 'employee']);
        $otherEmployee = Employee::factory()->create(['user_id' => $otherUser->id]);

        $today = Carbon::today()->format('Y-m-d');

        // Create approved leave for other employee
        Leave::create([
            'employee_id' => $otherEmployee->id,
            'type' => 'annual',
            'start_date' => $today,
            'end_date' => $today,
            'reason' => 'Liburan',
            'status' => 'approved',
        ]);

        // Create upcoming holiday
        Holiday::create([
            'description' => 'Hari Libur Nasional',
            'date' => Carbon::tomorrow()->format('Y-m-d'),
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/dashboard/stats');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'role',
                'geofencing' => ['latitude', 'longitude', 'radius'],
                'team_pulse' => [
                    'leaves_today',
                    'wfh_today',
                    'upcoming_birthdays',
                    'upcoming_holidays'
                ]
            ]
        ]);

        $this->assertCount(1, $response->json('data.team_pulse.leaves_today'));
        $this->assertEquals($otherUser->name, $response->json('data.team_pulse.leaves_today.0.name'));
        $this->assertCount(1, $response->json('data.team_pulse.upcoming_holidays'));
    }

    /** @test */
    public function employee_can_clock_in_with_wfh_mode(): void
    {
        $user = User::factory()->create(['role' => 'employee']);
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        // Simulated base64 png image
        $dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

        $response = $this->actingAs($user)->postJson('/api/v1/attendances/clock-in', [
            'latitude' => -6.2000000,
            'longitude' => 106.8166660,
            'photo' => $dummyBase64,
            'work_mode' => 'wfh',
            'notes' => 'Kerja dari rumah',
        ]);

        $response->assertStatus(200);

        $today = Carbon::today()->format('Y-m-d');
        $attendance = Attendance::where('employee_id', $employee->id)->where('date', $today)->first();

        $this->assertNotNull($attendance);
        $this->assertEquals('wfh', $attendance->work_mode);
        $this->assertEquals('Kerja dari rumah', $attendance->notes);
    }
}
