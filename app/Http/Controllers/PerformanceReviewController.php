<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\PerformanceReview;
use Illuminate\Support\Facades\Auth;

class PerformanceReviewController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if ($user->role === 'employee') {
            if (!$user->employee) return response()->json(['success' => true, 'data' => []]);
            $reviews = PerformanceReview::with(['employee.user', 'reviewer'])->where('employee_id', $user->employee->id)->orderBy('period_year', 'desc')->orderBy('period_month', 'desc')->get();
        } else {
            $reviews = PerformanceReview::with(['employee.user', 'reviewer'])->orderBy('period_year', 'desc')->orderBy('period_month', 'desc')->get();
        }
        return response()->json(['success' => true, 'data' => $reviews]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'hr'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'period_month' => 'required|integer|min:1|max:12',
            'period_year' => 'required|integer',
            'score' => 'required|integer|min:1|max:100',
            'notes' => 'required|string',
        ]);

        $review = PerformanceReview::create([
            'employee_id' => $request->employee_id,
            'reviewer_id' => $user->id,
            'period_month' => $request->period_month,
            'period_year' => $request->period_year,
            'score' => $request->score,
            'notes' => $request->notes
        ]);

        return response()->json(['success' => true, 'data' => $review]);
    }
}
