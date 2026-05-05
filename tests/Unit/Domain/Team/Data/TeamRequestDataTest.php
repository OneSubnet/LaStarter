<?php

namespace Tests\Unit\Domain\Team\Data;

use App\Domains\Team\Data\TeamRequestData;
use App\Models\Team;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class TeamRequestDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_from_array_creates_dto(): void
    {
        $data = TeamRequestData::from([
            'name' => 'Test Team',
            'isPersonal' => false,
        ]);

        $this->assertEquals('Test Team', $data->name);
        $this->assertFalse($data->isPersonal);
    }

    public function test_validation_requires_name(): void
    {
        $this->expectException(ValidationException::class);

        TeamRequestData::validate([
            'isPersonal' => false,
        ]);
    }

    public function test_validation_name_max_255_chars(): void
    {
        $this->expectException(ValidationException::class);

        TeamRequestData::validate([
            'name' => str_repeat('a', 256),
        ]);
    }

    public function test_to_model_fills_team_attributes(): void
    {
        $team = new Team;
        $data = new TeamRequestData(
            name: 'Test Team',
            isPersonal: true,
        );

        $result = $data->toModel($team);

        $this->assertSame($team, $result);
        $this->assertEquals('Test Team', $team->name);
        $this->assertTrue($team->is_personal);
    }

    public function test_is_personal_defaults_to_null(): void
    {
        $data = TeamRequestData::from([
            'name' => 'Test Team',
        ]);

        $this->assertNull($data->isPersonal);
    }

    public function test_is_personal_can_be_null(): void
    {
        $data = TeamRequestData::from([
            'name' => 'Test Team',
            'isPersonal' => null,
        ]);

        $this->assertNull($data->isPersonal);
    }

    public function test_validation_fails_for_reserved_team_names(): void
    {
        $this->expectException(ValidationException::class);

        TeamRequestData::validate([
            'name' => 'admin', // Reserved name
        ]);
    }

    public function test_validation_passes_for_valid_team_name(): void
    {
        $data = TeamRequestData::validateAndCreate([
            'name' => 'My Custom Team',
        ]);

        $this->assertEquals('My Custom Team', $data->name);
    }
}
