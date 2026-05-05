<?php

namespace Tests\Unit\Models;

use App\Models\Team;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamQueryScopesTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_scope_returns_only_active_teams(): void
    {
        Team::factory()->create(['is_active' => true]);
        Team::factory()->create(['is_active' => false]);

        $activeTeams = Team::active()->get();

        $this->assertCount(1, $activeTeams);
        $this->assertTrue($activeTeams->first()->is_active);
    }

    public function test_inactive_scope_returns_only_inactive_teams(): void
    {
        Team::factory()->create(['is_active' => true]);
        Team::factory()->create(['is_active' => false]);

        $inactiveTeams = Team::inactive()->get();

        $this->assertCount(1, $inactiveTeams);
        $this->assertFalse($inactiveTeams->first()->is_active);
    }

    public function test_search_scope_filters_by_name(): void
    {
        Team::factory()->create(['name' => 'Alpha Team']);
        Team::factory()->create(['name' => 'Beta Team']);

        $results = Team::search('alpha')->get();

        $this->assertCount(1, $results);
        $this->assertEquals('Alpha Team', $results->first()->name);
    }

    public function test_latest_scope_orders_by_created_at_desc(): void
    {
        $team1 = Team::factory()->create(['created_at' => now()->subDay()]);
        $team2 = Team::factory()->create(['created_at' => now()]);

        $teams = Team::latest()->get();

        $this->assertEquals($team2->id, $teams->first()->id);
    }

    public function test_oldest_scope_orders_by_created_at_asc(): void
    {
        $team1 = Team::factory()->create(['created_at' => now()->subDay()]);
        $team2 = Team::factory()->create(['created_at' => now()]);

        $teams = Team::oldest()->get();

        $this->assertEquals($team1->id, $teams->first()->id);
    }

    public function test_where_slug_scope_filters_by_slug(): void
    {
        Team::factory()->create(['slug' => 'alpha-team']);
        Team::factory()->create(['slug' => 'beta-team']);

        $team = Team::whereSlug('alpha-team')->first();

        $this->assertEquals('alpha-team', $team->slug);
    }

    public function test_where_slugs_in_scope_filters_by_multiple_slugs(): void
    {
        Team::factory()->create(['slug' => 'alpha-team']);
        Team::factory()->create(['slug' => 'beta-team']);
        Team::factory()->create(['slug' => 'gamma-team']);

        $teams = Team::whereSlugsIn(['alpha-team', 'beta-team'])->get();

        $this->assertCount(2, $teams);
    }

    public function test_count_returns_correct_count(): void
    {
        Team::factory()->count(3)->create();

        $count = Team::query()->count();

        $this->assertEquals(3, $count);
    }
}
