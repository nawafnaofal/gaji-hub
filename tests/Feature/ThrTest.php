<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Employee;
use App\Models\Thr;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;
use Tests\TestCase;

class ThrTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'Database\\Seeders\\RolesAndPermissionsSeeder']);
    }

    /** @test */
    public function hr_can_preview_and_generate_thr_with_permenaker_formula(): void
    {
        $hrUser = User::factory()->create(['role' => 'hr']);
        Employee::factory()->create(['user_id' => $hrUser->id]);

        // 1. Employee with 2 years of service (should get 100%)
        $seniorUser = User::factory()->create(['role' => 'employee']);
        $seniorEmp = Employee::factory()->create([
            'user_id' => $seniorUser->id,
            'join_date' => Carbon::now()->subMonths(24)->format('Y-m-d'),
            'basic_salary' => 12000000,
        ]);

        // 2. Employee with 6 months of service (should get 6/12 = 50%)
        $juniorUser = User::factory()->create(['role' => 'employee']);
        $juniorEmp = Employee::factory()->create([
            'user_id' => $juniorUser->id,
            'join_date' => Carbon::now()->subMonths(6)->format('Y-m-d'),
            'basic_salary' => 6000000,
        ]);

        // Test Preview
        $previewRes = $this->actingAs($hrUser)->getJson('/api/v1/thrs/preview?year=2026&religious_holiday=idul_fitri');
        $previewRes->assertStatus(200);
        $previewRes->assertJsonStructure(['success', 'data', 'total_estimated']);

        // Test Generate
        $genRes = $this->actingAs($hrUser)->postJson('/api/v1/thrs/generate', [
            'year' => 2026,
            'religious_holiday' => 'idul_fitri',
        ]);
        $genRes->assertStatus(200);

        // Verify senior gets full 12,000,000
        $seniorThr = Thr::where('employee_id', $seniorEmp->id)->where('period_year', 2026)->first();
        $this->assertNotNull($seniorThr);
        $this->assertEquals(12000000, $seniorThr->thr_amount);
        $this->assertEquals('draft', $seniorThr->status);

        // Verify junior gets prorata (approx 50% = 3,000,000)
        $juniorThr = Thr::where('employee_id', $juniorEmp->id)->where('period_year', 2026)->first();
        $this->assertNotNull($juniorThr);
        $this->assertEquals(3000000, round($juniorThr->thr_amount, -4)); // Allow minor day rounding
    }

    /** @test */
    public function hr_can_approve_and_disburse_thr(): void
    {
        $hrUser = User::factory()->create(['role' => 'hr']);
        $user = User::factory()->create(['role' => 'employee']);
        $emp = Employee::factory()->create(['user_id' => $user->id, 'basic_salary' => 10000000]);

        $thr = Thr::create([
            'employee_id' => $emp->id,
            'period_year' => 2026,
            'religious_holiday' => 'idul_fitri',
            'service_months' => 12,
            'basic_salary' => 10000000,
            'fixed_allowance' => 0,
            'thr_amount' => 10000000,
            'tax_pph21' => 0,
            'net_amount' => 10000000,
            'status' => 'draft',
        ]);

        // Approve
        $approveRes = $this->actingAs($hrUser)->putJson("/api/v1/thrs/{$thr->id}/approve");
        $approveRes->assertStatus(200);
        $this->assertEquals('approved', $thr->fresh()->status);

        // Disburse
        $disburseRes = $this->actingAs($hrUser)->putJson("/api/v1/thrs/{$thr->id}/disburse");
        $disburseRes->assertStatus(200);
        $this->assertEquals('paid', $thr->fresh()->status);
        $this->assertNotNull($thr->fresh()->payment_date);
    }

    /** @test */
    public function employee_cannot_generate_thr(): void
    {
        $user = User::factory()->create(['role' => 'employee']);
        Employee::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->postJson('/api/v1/thrs/generate', [
            'year' => 2026,
            'religious_holiday' => 'idul_fitri',
        ]);

        $response->assertStatus(403);
    }
}
