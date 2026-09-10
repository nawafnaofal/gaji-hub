<?php

namespace Tests\Feature;

use App\Models\ApprovalWorkflow;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApprovalWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $employee;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['role' => 'admin']);
        $this->employee = User::factory()->create(['role' => 'employee']);
    }

    public function test_employee_cannot_access_approval_workflows(): void
    {
        $response = $this->actingAs($this->employee)
            ->getJson('/api/v1/approval-workflows');

        $response->assertStatus(403);
    }

    public function test_index_seeds_defaults_if_empty_and_returns_workflows(): void
    {
        $this->assertEquals(0, ApprovalWorkflow::count());

        $response = $this->actingAs($this->user)
            ->getJson('/api/v1/approval-workflows');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data',
                'available_roles',
                'modules',
            ]);

        $this->assertGreaterThanOrEqual(4, ApprovalWorkflow::count());
        $this->assertDatabaseHas('approval_workflows', [
            'module' => 'leave',
        ]);
        $this->assertDatabaseHas('approval_workflows', [
            'module' => 'reimbursement',
        ]);
    }

    public function test_can_create_custom_workflow_with_tiers(): void
    {
        $payload = [
            'module' => 'reimbursement',
            'name' => 'Klaim Biaya Operasional > 10 Juta',
            'min_amount' => 10000000,
            'max_amount' => null,
            'tiers' => [
                ['level' => 1, 'role' => 'direct_manager', 'label' => 'Direct Manager Approval'],
                ['level' => 2, 'role' => 'finance', 'label' => 'Finance Approval'],
                ['level' => 3, 'role' => 'director', 'label' => 'Director Approval'],
            ],
            'is_active' => true,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/approval-workflows', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Klaim Biaya Operasional > 10 Juta',
                    'module' => 'reimbursement',
                ],
            ]);

        $this->assertDatabaseHas('approval_workflows', [
            'name' => 'Klaim Biaya Operasional > 10 Juta',
            'module' => 'reimbursement',
            'min_amount' => 10000000,
        ]);
    }

    public function test_can_update_approval_workflow(): void
    {
        $workflow = ApprovalWorkflow::create([
            'module' => 'cash_advance',
            'name' => 'Kasbon Ringan',
            'min_amount' => 0,
            'max_amount' => 2000000,
            'tiers' => [
                ['level' => 1, 'role' => 'direct_manager', 'label' => 'Direct Manager'],
            ],
            'is_active' => true,
        ]);

        $updatePayload = [
            'name' => 'Kasbon Ringan Diperbarui',
            'max_amount' => 3000000,
            'tiers' => [
                ['level' => 1, 'role' => 'direct_manager', 'label' => 'Direct Manager'],
                ['level' => 2, 'role' => 'finance', 'label' => 'Finance Officer'],
            ],
        ];

        $response = $this->actingAs($this->user)
            ->putJson("/api/v1/approval-workflows/{$workflow->id}", $updatePayload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Kasbon Ringan Diperbarui',
                    'max_amount' => 3000000,
                ],
            ]);

        $this->assertDatabaseHas('approval_workflows', [
            'id' => $workflow->id,
            'name' => 'Kasbon Ringan Diperbarui',
            'max_amount' => 3000000,
        ]);
    }

    public function test_can_preview_workflow_matching_threshold(): void
    {
        // Setup two tiers of reimbursement
        ApprovalWorkflow::create([
            'module' => 'reimbursement',
            'name' => 'Reimbursement < 5 Juta',
            'min_amount' => 0,
            'max_amount' => 5000000,
            'tiers' => [
                ['level' => 1, 'role' => 'direct_manager', 'label' => 'Direct Manager'],
            ],
            'is_active' => true,
        ]);

        ApprovalWorkflow::create([
            'module' => 'reimbursement',
            'name' => 'Reimbursement >= 5 Juta',
            'min_amount' => 5000001,
            'max_amount' => null,
            'tiers' => [
                ['level' => 1, 'role' => 'direct_manager', 'label' => 'Direct Manager'],
                ['level' => 2, 'role' => 'director', 'label' => 'Director Approval'],
            ],
            'is_active' => true,
        ]);

        // Preview with 2,500,000 should match first
        $previewSmall = $this->actingAs($this->user)
            ->postJson('/api/v1/approval-workflows/preview', [
                'module' => 'reimbursement',
                'amount' => 2500000,
            ]);

        $previewSmall->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Reimbursement < 5 Juta',
                ],
            ]);

        // Preview with 15,000,000 should match second
        $previewLarge = $this->actingAs($this->user)
            ->postJson('/api/v1/approval-workflows/preview', [
                'module' => 'reimbursement',
                'amount' => 15000000,
            ]);

        $previewLarge->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Reimbursement >= 5 Juta',
                ],
            ]);
    }

    public function test_can_delete_approval_workflow(): void
    {
        $workflow = ApprovalWorkflow::create([
            'module' => 'leave',
            'name' => 'Temporary Workflow',
            'min_amount' => 0,
            'max_amount' => null,
            'tiers' => [
                ['level' => 1, 'role' => 'hr', 'label' => 'HR Only'],
            ],
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/v1/approval-workflows/{$workflow->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('approval_workflows', [
            'id' => $workflow->id,
        ]);
    }
}
