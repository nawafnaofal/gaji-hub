<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Employee;
use App\Models\Attendance;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Illuminate\Support\Str;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->date ?? date('Y-m-d');

        $employees = Employee::with(['user', 'attendance' => function($q) use ($date) {
            $q->whereDate('date', $date);
        }])->get();

        return response()->json(['success' => true, 'data' => $employees]);
    }

    public function exportExcel(Request $request)
    {
        $month = $request->query('month');
        $year = $request->query('year');
        $fileName = 'rekap_absensi_' . ($month ?? 'all') . '_' . ($year ?? 'all') . '.xlsx';
        
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\AttendancesExport($month, $year), $fileName);
    }

    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,leave,late'
        ]);

        $attendance = Attendance::updateOrCreate(
            ['employee_id' => $request->employee_id, 'date' => $request->date],
            ['status' => $request->status]
        );

        return response()->json(['success' => true, 'data' => $attendance]);
    }

    public function clockIn(Request $request)
    {
        $employee = Auth::user()->employee;
        if (!$employee) return response()->json(['success' => false, 'message' => 'Not an employee'], 403);

        $today = Carbon::today()->format('Y-m-d');
        $now = Carbon::now();
        $currentTime = $now->format('H:i:s');

        // Check if already clock in
        $attendance = Attendance::where('employee_id', $employee->id)->where('date', $today)->first();
        if ($attendance && $attendance->clock_in) {
            return response()->json(['success' => false, 'message' => 'Anda sudah melakukan clock in hari ini.'], 400);
        }

        $photoPath = null;
        if ($request->has('photo')) {
            $imageParts = explode(";base64,", $request->photo);
            if (count($imageParts) == 2) {
                $imageTypeAux = explode("image/", $imageParts[0]);
                $imageType = $imageTypeAux[1];
                $imageBase64 = base64_decode($imageParts[1]);
                $fileName = 'attendance/' . Str::uuid() . '.' . $imageType;
                Storage::disk('public')->put($fileName, $imageBase64);
                $photoPath = $fileName;
            }
        }

        // Determine status (Late if after 08:00:00)
        $status = $currentTime > '08:00:00' ? 'late' : 'present';

        $attendance = Attendance::updateOrCreate(
            ['employee_id' => $employee->id, 'date' => $today],
            [
                'clock_in' => $currentTime, 
                'status' => $status,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'photo_path' => $photoPath
            ]
        );

        return response()->json(['success' => true, 'message' => 'Berhasil Clock In.', 'data' => $attendance]);
    }

    public function clockOut(Request $request)
    {
        $employee = Auth::user()->employee;
        if (!$employee) return response()->json(['success' => false, 'message' => 'Not an employee'], 403);

        $today = Carbon::today()->format('Y-m-d');
        $currentTime = Carbon::now()->format('H:i:s');

        $attendance = Attendance::where('employee_id', $employee->id)->where('date', $today)->first();
        if (!$attendance || !$attendance->clock_in) {
            return response()->json(['success' => false, 'message' => 'Anda belum melakukan clock in hari ini.'], 400);
        }

        $attendance->update(['clock_out' => $currentTime]);

        return response()->json(['success' => true, 'message' => 'Berhasil Clock Out.', 'data' => $attendance]);
    }
}
