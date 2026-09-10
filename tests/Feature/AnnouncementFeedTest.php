<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\AnnouncementRead;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnnouncementFeedTest extends TestCase
{
    use RefreshDatabase;

    private User $hr;
    private User $empUser1;
    private User $empUser2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hr = User::factory()->create(['role' => 'hr']);

        $this->empUser1 = User::factory()->create(['role' => 'employee']);
        Employee::create([
            'user_id' => $this->empUser1->id,
            'employee_code' => 'EMP-01',
            'department' => 'Engineering',
            'basic_salary' => 8000000,
            'employment_status' => 'permanent',
        ]);

        $this->empUser2 = User::factory()->create(['role' => 'employee']);
        Employee::create([
            'user_id' => $this->empUser2->id,
            'employee_code' => 'EMP-02',
            'department' => 'Finance',
            'basic_salary' => 7000000,
            'employment_status' => 'permanent',
        ]);
    }

    public function test_hr_can_create_announcement_with_pin_and_category(): void
    {
        $response = $this->actingAs($this->hr)->postJson('/api/v1/announcements', [
            'title' => 'SK Direksi Libur Hari Raya 2026',
            'content' => 'Berdasarkan keputusan direksi, libur bersama ditetapkan...',
            'category' => 'policy',
            'is_pinned' => true,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('announcements', [
            'title' => 'SK Direksi Libur Hari Raya 2026',
            'category' => 'policy',
            'is_pinned' => true,
        ]);
    }

    public function test_employee_can_mark_announcement_as_read(): void
    {
        $ann = Announcement::create([
            'title' => 'Perubahan Jam Kerja Ramadhan',
            'content' => 'Jam kerja disesuaikan mulai pukul 08:00...',
            'category' => 'general',
            'is_active' => true,
            'created_by' => $this->hr->id,
        ]);

        // Employee 1 marks as read
        $response = $this->actingAs($this->empUser1)->postJson("/api/v1/announcements/{$ann->id}/read");
        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('announcement_reads', [
            'announcement_id' => $ann->id,
            'user_id' => $this->empUser1->id,
        ]);

        // Index shows read state
        $indexResponse = $this->actingAs($this->empUser1)->getJson('/api/v1/announcements');
        $indexResponse->assertStatus(200)
            ->assertJsonPath('data.0.is_read_by_me', true)
            ->assertJsonPath('data.0.reads_count', 1);
    }

    public function test_hr_can_toggle_pin_and_view_read_stats(): void
    {
        $ann = Announcement::create([
            'title' => 'Emergency Server Maintenance',
            'content' => 'Maintenance malam ini pukul 22:00...',
            'category' => 'urgent',
            'is_pinned' => false,
            'is_active' => true,
            'created_by' => $this->hr->id,
        ]);

        // 1. Toggle pin
        $pinResponse = $this->actingAs($this->hr)->putJson("/api/v1/announcements/{$ann->id}/pin");
        $pinResponse->assertStatus(200);
        $this->assertTrue($ann->fresh()->is_pinned);

        // Employee 1 reads
        AnnouncementRead::create([
            'announcement_id' => $ann->id,
            'user_id' => $this->empUser1->id,
            'read_at' => now(),
        ]);

        // 2. HR views stats
        $statsResponse = $this->actingAs($this->hr)->getJson("/api/v1/announcements/{$ann->id}/stats");
        $statsResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_read', 1)
            ->assertJsonPath('data.readers.0.user_id', $this->empUser1->id);
    }
}
