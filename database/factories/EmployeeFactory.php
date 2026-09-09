<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'department_id' => $this->faker->randomElement(['Technology', 'Human Resources', 'Finance', 'Marketing', 'Operations']),
            'employee_code' => 'EMP-' . strtoupper($this->faker->unique()->bothify('??###')),
            'basic_salary' => $this->faker->randomElement([5000000, 7000000, 8500000, 10000000, 12000000, 15000000]),
            'join_date' => $this->faker->dateTimeBetween('-3 years', '-1 month')->format('Y-m-d'),
            'job_title' => $this->faker->randomElement(['Software Engineer', 'HR Specialist', 'Accountant', 'Marketing Lead', 'Operations Manager']),
            'employment_status' => $this->faker->randomElement(['permanent', 'contract', 'probation']),
            'bank_name' => $this->faker->randomElement(['BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB Niaga']),
            'bank_account' => $this->faker->numerify('##########'),
            'npwp_number' => $this->faker->numerify('##.###.###.#-###.###'),
            'phone' => $this->faker->phoneNumber(),
            'address' => $this->faker->address(),
            'annual_leave_quota' => 12,
            'tax_status' => $this->faker->randomElement(['TK/0', 'TK/1', 'K/0', 'K/1', 'K/2']),
        ];
    }

    /**
     * Define employee as permanent.
     */
    public function permanent(): static
    {
        return $this->state(fn (array $attributes) => [
            'employment_status' => 'permanent',
        ]);
    }

    /**
     * Define employee as resigned.
     */
    public function resigned(): static
    {
        return $this->state(fn (array $attributes) => [
            'employment_status' => 'resigned',
            'resign_date' => now()->subMonth()->toDateString(),
            'termination_reason' => 'Resign atas keinginan sendiri.',
        ]);
    }
}
