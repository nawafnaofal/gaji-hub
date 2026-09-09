<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Employee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Seed roles if using Spatie permissions
        $this->artisan('db:seed', ['--class' => 'Database\\Seeders\\RoleSeeder']);
    }

    /** @test */
    public function employee_cannot_access_hr_pages(): void
    {
        $user = User::factory()->create(['role' => 'employee']);
        $employee = Employee::factory()->create(['user_id' => $user->id]);
        
        $response = $this->actingAs($user)->get('/employees');
        $response->assertStatus(403);

        $response = $this->actingAs($user)->get('/payroll');
        $response->assertStatus(403);

        $response = $this->actingAs($user)->get('/settings');
        $response->assertStatus(403);

        $response = $this->actingAs($user)->get('/warning-letters');
        $response->assertStatus(403);
    }

    /** @test */
    public function hr_can_access_employee_management(): void
    {
        $user = User::factory()->create(['role' => 'hr']);

        $response = $this->actingAs($user)->get('/employees');
        $response->assertStatus(200);

        $response = $this->actingAs($user)->get('/payroll');
        $response->assertStatus(200);
    }

    /** @test */
    public function admin_can_access_audit_logs(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($user)->get('/audit-logs');
        $response->assertStatus(200);
    }

    /** @test */
    public function hr_cannot_access_audit_logs(): void
    {
        $user = User::factory()->create(['role' => 'hr']);

        $response = $this->actingAs($user)->get('/audit-logs');
        $response->assertStatus(403);
    }

    /** @test */
    public function guest_is_redirected_to_login(): void
    {
        $response = $this->get('/dashboard');
        $response->assertRedirect('/login');
    }

    /** @test */
    public function employee_can_access_own_dashboard(): void
    {
        $user = User::factory()->create(['role' => 'employee']);

        $response = $this->actingAs($user)->get('/dashboard');
        $response->assertStatus(200);
    }

    /** @test */
    public function employee_can_access_leaves_page(): void
    {
        $user = User::factory()->create(['role' => 'employee']);

        $response = $this->actingAs($user)->get('/leaves');
        $response->assertStatus(200);
    }

    /** @test */
    public function api_returns_403_for_unauthorized_employee_endpoints(): void
    {
        $user = User::factory()->create(['role' => 'employee']);

        $response = $this->actingAs($user)->getJson('/api/v1/employees');
        // Employee should have access through shared route, controller handles filtering
        $response->assertStatus(200);

        $response = $this->actingAs($user)->postJson('/api/v1/employees', []);
        // POST to employees requires admin/hr role
        $response->assertStatus(403);
    }
}
