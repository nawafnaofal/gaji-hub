<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Employee;
use App\Models\Branch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BranchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'Database\\Seeders\\RolesAndPermissionsSeeder']);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function hr_can_create_and_list_branches(): void
    {
        $hrUser = User::factory()->create(['role' => 'hr']);
        Employee::factory()->create(['user_id' => $hrUser->id]);

        // 1. Create a branch
        $res = $this->actingAs($hrUser)->postJson('/api/v1/branches', [
            'name' => 'Cabang Surabaya Gubeng',
            'code' => 'SBY-01',
            'address' => 'Jl. Gubeng No. 10, Surabaya',
            'latitude' => -7.2654000,
            'longitude' => 112.7521000,
            'radius_meters' => 150,
            'is_head_office' => false,
            'is_active' => true,
        ]);

        $res->assertStatus(201);
        $this->assertDatabaseHas('branches', [
            'code' => 'SBY-01',
            'name' => 'Cabang Surabaya Gubeng',
        ]);

        // 2. List branches
        $listRes = $this->actingAs($hrUser)->getJson('/api/v1/branches');
        $listRes->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($listRes->json('data')));
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function employee_clock_in_is_validated_against_assigned_branch_radius(): void
    {
        // Setup branch in Jakarta Pusat
        $branch = Branch::create([
            'name' => 'Kantor Cabang Thamrin',
            'code' => 'THM-01',
            'address' => 'Jl. MH Thamrin No. 1',
            'latitude' => -6.1950000,
            'longitude' => 106.8230000,
            'radius_meters' => 100,
            'is_head_office' => false,
            'is_active' => true,
        ]);

        $user = User::factory()->create(['role' => 'employee']);
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'branch_id' => $branch->id,
        ]);

        // A fake 1x1 png base64
        $fakePhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        // 1. Clock in 1000+ meters away -> REJECTED
        $farRes = $this->actingAs($user)->postJson('/api/v1/attendances/clock-in', [
            'latitude' => -6.2150000, // ~2.2 km away
            'longitude' => 106.8230000,
            'photo' => $fakePhoto,
            'work_mode' => 'wfo',
        ]);

        $farRes->assertStatus(400);
        $this->assertStringContainsString('Kantor Cabang Thamrin', $farRes->json('message'));

        // 2. Clock in within radius (~10 meters away) -> SUCCESS
        $nearRes = $this->actingAs($user)->postJson('/api/v1/attendances/clock-in', [
            'latitude' => -6.1950500,
            'longitude' => 106.8230500,
            'photo' => $fakePhoto,
            'work_mode' => 'wfo',
        ]);

        $nearRes->assertStatus(200);
        $this->assertDatabaseHas('attendances', [
            'employee_id' => $employee->id,
            'work_mode' => 'wfo',
        ]);
        $this->assertNotNull(\App\Models\Attendance::where('employee_id', $employee->id)->first()->clock_in);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function employee_cannot_create_or_delete_branch(): void
    {
        $user = User::factory()->create(['role' => 'employee']);
        Employee::factory()->create(['user_id' => $user->id]);

        $res = $this->actingAs($user)->postJson('/api/v1/branches', [
            'name' => 'Illegal Branch',
            'code' => 'ILL-01',
            'latitude' => -6.2,
            'longitude' => 106.8,
            'radius_meters' => 100,
        ]);

        $res->assertStatus(403);
    }
}
