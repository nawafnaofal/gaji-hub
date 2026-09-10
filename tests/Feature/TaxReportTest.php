<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\Thr;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaxReportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'Database\\Seeders\\RolesAndPermissionsSeeder']);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function hr_can_list_annual_tax_reports_and_preview_1721_a1(): void
    {
        $hrUser = User::factory()->create(['role' => 'hr']);
        Employee::factory()->create(['user_id' => $hrUser->id]);

        $empUser = User::factory()->create(['role' => 'employee']);
        $emp = Employee::factory()->create([
            'user_id' => $empUser->id,
            'basic_salary' => 10000000,
            'tax_status' => 'TK/0',
            'join_date' => '2025-01-01',
        ]);

        // Create approved payroll for month 1 and 2 of 2026
        Payroll::create([
            'employee_id' => $emp->id,
            'period_month' => 1,
            'period_year' => 2026,
            'total_basic' => 10000000,
            'total_allowance' => 1000000,
            'total_deduction' => 500000,
            'net_salary' => 10500000,
            'status' => 'approved',
            'details' => [
                'allowances' => ['transport' => 500000, 'meal' => 500000, 'overtime' => 0],
                'benefits' => ['bpjs_tk_jkk' => 24000, 'bpjs_tk_jkm' => 30000, 'bpjs_kesehatan' => 400000],
                'deductions' => ['bpjs_tk_jht' => 200000, 'bpjs_tk_jp' => 100000, 'pph21' => 250000],
            ],
        ]);

        // 1. HR list endpoint
        $listRes = $this->actingAs($hrUser)->getJson('/api/v1/tax-reports?year=2026');
        $listRes->assertStatus(200);
        $listRes->assertJsonStructure(['success', 'year', 'data', 'summary']);

        // 2. HR preview endpoint
        $prevRes = $this->actingAs($hrUser)->getJson("/api/v1/tax-reports/{$emp->id}/preview?year=2026");
        $prevRes->assertStatus(200);
        $prevRes->assertJsonStructure([
            'success',
            'data' => [
                'year',
                'tax_number',
                'point1_gaji',
                'point8_bruto',
                'point9_biaya_jabatan',
                'point11_total_pengurangan',
                'point12_neto',
                'point15_ptkp',
                'point16_pkp',
                'point17_pph21_terutang',
                'point20_pph21_telah_dipotong',
                'point21_selisih',
            ]
        ]);

        $this->assertEquals(54000000, $prevRes->json('data.point15_ptkp')); // TK/0
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function hr_and_employee_can_download_1721_a1_pdf(): void
    {
        $hrUser = User::factory()->create(['role' => 'hr']);
        Employee::factory()->create(['user_id' => $hrUser->id]);

        $empUser = User::factory()->create(['role' => 'employee']);
        $emp = Employee::factory()->create([
            'user_id' => $empUser->id,
            'basic_salary' => 8000000,
            'tax_status' => 'K/1',
            'join_date' => '2025-01-01',
        ]);

        // 1. HR downloads employee 1721-A1 PDF
        $hrPdfRes = $this->actingAs($hrUser)->get("/api/v1/tax-reports/{$emp->id}/pdf?year=2026");
        $hrPdfRes->assertStatus(200);
        $this->assertEquals('application/pdf', $hrPdfRes->headers->get('Content-Type'));

        // 2. Employee downloads own 1721-A1 PDF via ESS
        $empPdfRes = $this->actingAs($empUser)->get("/api/v1/tax-reports/my/pdf?year=2026");
        $empPdfRes->assertStatus(200);
        $this->assertEquals('application/pdf', $empPdfRes->headers->get('Content-Type'));
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function employee_cannot_access_hr_tax_overview_or_other_employee_report(): void
    {
        $empUser1 = User::factory()->create(['role' => 'employee']);
        Employee::factory()->create(['user_id' => $empUser1->id]);

        $empUser2 = User::factory()->create(['role' => 'employee']);
        $emp2 = Employee::factory()->create(['user_id' => $empUser2->id]);

        // Cannot view HR tax list
        $res1 = $this->actingAs($empUser1)->getJson('/api/v1/tax-reports?year=2026');
        $res1->assertStatus(403);

        // Cannot preview other employee report
        $res2 = $this->actingAs($empUser1)->getJson("/api/v1/tax-reports/{$emp2->id}/preview?year=2026");
        $res2->assertStatus(403);
    }
}
