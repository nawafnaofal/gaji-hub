<?php

namespace Database\Factories;

use App\Models\Payroll;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

class PayrollFactory extends Factory
{
    protected $model = Payroll::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'period_month' => $this->faker->numberBetween(1, 12),
            'period_year' => now()->year,
            'total_basic' => $basicSalary = $this->faker->randomElement([5000000, 8000000, 10000000]),
            'total_allowance' => $allowance = $this->faker->numberBetween(500000, 3000000),
            'total_deduction' => $deduction = $this->faker->numberBetween(200000, 1500000),
            'net_salary' => $basicSalary + $allowance - $deduction,
            'status' => 'draft',
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
        ]);
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'paid',
        ]);
    }
}
