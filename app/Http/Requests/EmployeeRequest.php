<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class EmployeeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Get ID from route for update request
        $employeeId = $this->route('id');
        $employee = $employeeId ? \App\Models\Employee::find($employeeId) : null;
        $userId = $employee ? $employee->user_id : null;

        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $userId,
            'department_id' => 'required|string|max:255',
            'employee_code' => 'required|string|max:50|unique:employees,employee_code,' . $employeeId,
            'basic_salary' => 'required|numeric|min:0',
            'join_date' => 'required|date',
            'job_title' => 'nullable|string|max:255',
            'employment_status' => 'nullable|in:permanent,contract,probation,resigned,terminated',
            'bank_name' => 'nullable|string|max:255',
            'bank_account' => 'nullable|string|max:255',
            'npwp_number' => 'nullable|string|max:255',
            'bpjs_kesehatan' => 'nullable|string|max:255',
            'bpjs_ketenagakerjaan' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'annual_leave_quota' => 'nullable|integer|min:0',
            'role' => 'nullable|in:admin,hr,manager,employee',
            'manager_id' => 'nullable|exists:employees,id',
            'tax_status' => 'nullable|string|in:TK/0,TK/1,TK/2,TK/3,K/0,K/1,K/2,K/3',
            'resign_date' => 'nullable|date',
            'termination_reason' => 'nullable|string|max:500'
        ];
    }
}
