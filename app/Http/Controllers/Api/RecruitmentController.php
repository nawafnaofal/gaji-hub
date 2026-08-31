<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\JobPosition;
use App\Models\JobApplication;
use App\Models\Candidate;
use App\Models\Interview;

class RecruitmentController extends Controller
{
    public function getPositions()
    {
        return response()->json(['data' => JobPosition::all()]);
    }

    public function storePosition(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required',
            'department' => 'required',
            'status' => 'required',
            'type' => 'required'
        ]);
        $position = JobPosition::create($request->all());
        return response()->json(['success' => true, 'data' => $position]);
    }

    public function getApplications()
    {
        return response()->json(['data' => JobApplication::with(['candidate', 'jobPosition'])->get()]);
    }

    public function updateApplicationStatus(Request $request, $id)
    {
        $app = JobApplication::findOrFail($id);
        $app->update(['status' => $request->status]);
        return response()->json(['success' => true, 'data' => $app]);
    }

    public function applyPublic(Request $request)
    {
        $validated = $request->validate([
            'job_position_id' => 'required',
            'name' => 'required',
            'email' => 'required|email'
        ]);

        $candidate = Candidate::firstOrCreate(
            ['email' => $request->email],
            ['name' => $request->name, 'phone' => $request->phone]
        );

        $app = JobApplication::create([
            'candidate_id' => $candidate->id,
            'job_position_id' => $request->job_position_id,
            'status' => 'applied'
        ]);

        return response()->json(['success' => true, 'data' => $app]);
    }
}
