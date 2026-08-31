<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Employee;

class OrgChartController extends Controller
{
    public function index()
    {
        // Get all employees with their user data
        $employees = Employee::with('user')->get();

        // Build the tree
        $tree = $this->buildTree($employees);

        return response()->json(['success' => true, 'data' => $tree]);
    }

    private function buildTree($elements, $parentId = null)
    {
        $branch = [];

        foreach ($elements as $element) {
            if ($element->manager_id == $parentId) {
                $children = $this->buildTree($elements, $element->id);
                
                $node = [
                    'id' => $element->id,
                    'name' => $element->user ? $element->user->name : 'Unknown',
                    'title' => $element->position,
                    'department' => $element->department
                ];

                if ($children) {
                    $node['children'] = $children;
                }

                $branch[] = $node;
            }
        }

        return $branch;
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'position' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'manager_id' => 'nullable|exists:employees,id',
        ]);

        $employee = Employee::findOrFail($id);
        
        // Prevent cyclic dependency (manager_id cannot be themselves)
        if ($request->manager_id == $employee->id) {
            return response()->json(['success' => false, 'message' => 'Cannot set self as manager'], 400);
        }

        $employee->update([
            'position' => $request->position,
            'department' => $request->department,
            'manager_id' => $request->manager_id,
        ]);

        return response()->json(['success' => true, 'message' => 'Org chart updated successfully']);
    }
}
