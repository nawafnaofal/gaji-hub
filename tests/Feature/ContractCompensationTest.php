<?php

namespace Tests\Feature;

use App\Models\ContractCompensation;
use App\Models\Employee;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContractCompensationTest extends TestCase
{
    use RefreshDatabase;

    private User $hr;
    private User $contractUser;
    private Employee $contractEmployee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hr = User::factory()->create(['role' => 'hr']);

        $this->contractUser = User::factory()->create(['role' => 'employee']);
        $this->contractEmployee = Employee::create([
            'user_id' => $this->contractUser->id,
            'employee_code' => 'PKWT-001',
            'basic_salary' => 6000000,
            'employment_status' => 'contract',
            'join_date' => '2025-10-01',
            'contract_end_date' => '2026-10-01', // 12 bulan
        ]);
    }

    public function test_compensation_calculation_follows_pp_35_2021(): void
    {
        // 12 bulan kerja -> 1 bulan upah = 6.000.000
        $calc12 = ContractCompensation::calculateCompensation($this->contractEmployee);
        $this->assertEquals(12, $calc12['tenure_months']);
        $this->assertEquals(6000000, $calc12['compensation_amount']);

        // 6 bulan kerja -> (6/12) x 6.000.000 = 3.000.000
        $calc6 = ContractCompensation::calculateCompensation($this->contractEmployee, '2026-04-01');
        $this->assertEquals(6, $calc6['tenure_months']);
        $this->assertEquals(3000000, $calc6['compensation_amount']);

        // Kurang dari 1 bulan -> Rp 0
        $calc0 = ContractCompensation::calculateCompensation($this->contractEmployee, '2025-10-15');
        $this->assertEquals(0, $calc0['compensation_amount']);
    }

    public function test_hr_can_view_expiring_contracts_radar(): void
    {
        // Kontrak berakhir 15 hari lagi dari hari ini
        $this->contractEmployee->update([
            'contract_end_date' => Carbon::today()->addDays(15)->toDateString(),
        ]);

        $response = $this->actingAs($this->hr)->getJson('/api/v1/contract-compensations/expiring?days=60');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $data = $response->json('data');
        $this->assertNotEmpty($data);
        $this->assertEquals($this->contractEmployee->id, $data[0]['employee_id']);
        $this->assertEquals(15, $data[0]['days_left']);
    }

    public function test_hr_can_generate_approve_and_mark_paid_compensation(): void
    {
        // 1. HR generate kompensasi
        $genResponse = $this->actingAs($this->hr)->postJson('/api/v1/contract-compensations/generate', [
            'employee_id' => $this->contractEmployee->id,
            'override_end_date' => '2026-10-01',
            'notes' => 'Pemberian uang kompensasi PKWT tahun 2026',
        ]);

        $genResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('contract_compensations', [
            'employee_id' => $this->contractEmployee->id,
            'status' => 'draft',
            'compensation_amount' => 6000000,
        ]);

        $comp = ContractCompensation::where('employee_id', $this->contractEmployee->id)->first();

        // 2. HR approve
        $apprResponse = $this->actingAs($this->hr)->putJson("/api/v1/contract-compensations/{$comp->id}/approve");
        $apprResponse->assertStatus(200);
        $this->assertEquals('approved', $comp->fresh()->status);

        // 3. HR mark paid
        $payResponse = $this->actingAs($this->hr)->putJson("/api/v1/contract-compensations/{$comp->id}/pay");
        $payResponse->assertStatus(200);
        $this->assertEquals('paid', $comp->fresh()->status);
        $this->assertNotNull($comp->fresh()->paid_at);
    }

    public function test_hr_and_employee_can_download_slip_kompensasi_pdf(): void
    {
        $comp = ContractCompensation::create([
            'employee_id' => $this->contractEmployee->id,
            'contract_start_date' => '2025-10-01',
            'contract_end_date' => '2026-10-01',
            'tenure_months' => 12,
            'monthly_wage' => 6000000,
            'compensation_amount' => 6000000,
            'status' => 'paid',
            'paid_at' => Carbon::today()->toDateString(),
        ]);

        // HR download
        $hrResponse = $this->actingAs($this->hr)->get("/api/v1/contract-compensations/{$comp->id}/slip-pdf");
        $hrResponse->assertStatus(200)
            ->assertHeader('content-type', 'application/pdf');

        // Karyawan download slip miliknya
        $empResponse = $this->actingAs($this->contractUser)->get("/api/v1/contract-compensations/{$comp->id}/slip-pdf");
        $empResponse->assertStatus(200)
            ->assertHeader('content-type', 'application/pdf');
    }

    public function test_employee_cannot_access_other_slip_or_approve(): void
    {
        $otherUser = User::factory()->create(['role' => 'employee']);
        $otherEmployee = Employee::create([
            'user_id' => $otherUser->id,
            'employee_code' => 'PKWT-002',
            'basic_salary' => 5000000,
            'employment_status' => 'contract',
            'join_date' => '2025-01-01',
            'contract_end_date' => '2026-01-01',
        ]);

        $comp = ContractCompensation::create([
            'employee_id' => $this->contractEmployee->id,
            'contract_start_date' => '2025-10-01',
            'contract_end_date' => '2026-10-01',
            'tenure_months' => 12,
            'monthly_wage' => 6000000,
            'compensation_amount' => 6000000,
            'status' => 'approved',
        ]);

        // Other employee tries to download
        $dlResponse = $this->actingAs($otherUser)->get("/api/v1/contract-compensations/{$comp->id}/slip-pdf");
        $dlResponse->assertStatus(403);

        // Employee tries to approve
        $apprResponse = $this->actingAs($this->contractUser)->putJson("/api/v1/contract-compensations/{$comp->id}/approve");
        $apprResponse->assertStatus(403);
    }
}
