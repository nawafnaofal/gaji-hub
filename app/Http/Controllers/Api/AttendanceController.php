<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Employee;
use App\Models\Attendance;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
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
        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'photo' => 'required|string'
        ]);

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
                $imageType = $imageTypeAux[1] ?? 'png';
                $imageBase64 = base64_decode($imageParts[1]);
                
                // Validate base64 is valid image data
                if ($imageBase64 === false || strlen($imageBase64) > 10 * 1024 * 1024) {
                    return response()->json(['success' => false, 'message' => 'Foto tidak valid atau terlalu besar (max 10MB).'], 400);
                }
                
                $fileName = 'attendance/' . Str::uuid() . '.' . $imageType;
                Storage::disk('public')->put($fileName, $imageBase64);
                $photoPath = $fileName;
            }
        }

        $workMode = $request->input('work_mode', 'wfo');
        $notes = $request->input('notes');

        // Geofencing Check (enforce only for WFO mode)
        if ($workMode === 'wfo' && $request->latitude && $request->longitude) {
            $branch = $employee->branch;
            if (!$branch || !$branch->is_active) {
                $branch = \App\Models\Branch::where('is_head_office', true)->where('is_active', true)->first();
            }

            if ($branch) {
                $officeLat = (float) $branch->latitude;
                $officeLng = (float) $branch->longitude;
                $radius = (int) $branch->radius_meters;
                $branchName = $branch->name;
            } else {
                $settings = cache()->remember('company_settings_mapped', 86400, function () {
                    $all = \App\Models\CompanySetting::all();
                    $mappedData = [];
                    foreach ($all as $setting) {
                        $mappedData[$setting->key] = $setting->value;
                    }
                    return $mappedData;
                });

                $officeLat = (float) ($settings['office_latitude'] ?? -6.151595380868531);
                $officeLng = (float) ($settings['office_longitude'] ?? 106.77652147472021);
                $radius = (int) ($settings['office_radius'] ?? 50);
                $branchName = 'Kantor Pusat';
            }

            $earthRadius = 6371000; // meters
            $latFrom = deg2rad((float)$request->latitude);
            $lonFrom = deg2rad((float)$request->longitude);
            $latTo = deg2rad((float)$officeLat);
            $lonTo = deg2rad((float)$officeLng);

            $latDelta = $latTo - $latFrom;
            $lonDelta = $lonTo - $lonFrom;

            $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) + cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
            $distance = $angle * $earthRadius;

            if ($distance > $radius) {
                return response()->json([
                    'success' => false,
                    'message' => "Anda berada di luar radius {$branchName} (" . round($distance) . " meter). Radius maksimal: {$radius} meter."
                ], 400);
            }
        }

        // Determine status dynamically based on WorkSchedule or EmployeeShift (Roster)
        $targetTime = '08:00:00';
        $tolerance = 0;
        
        $todayShift = \App\Models\EmployeeShift::where('employee_id', $employee->id)->where('date', $today)->first();

        if ($todayShift && $todayShift->workSchedule) {
            $targetTime = $todayShift->workSchedule->clock_in_time;
            $tolerance = $todayShift->workSchedule->late_tolerance_minutes ?? 0;
        } elseif ($employee->workSchedule) {
            $targetTime = $employee->workSchedule->clock_in_time;
            $tolerance = $employee->workSchedule->late_tolerance_minutes ?? 0;
        }

        $limitTime = Carbon::createFromFormat('H:i:s', $targetTime)->addMinutes($tolerance)->format('H:i:s');
        $status = $currentTime > $limitTime ? 'late' : 'present';

        $attendance = Attendance::updateOrCreate(
            ['employee_id' => $employee->id, 'date' => $today],
            [
                'clock_in' => $currentTime, 
                'status' => $status,
                'work_mode' => $workMode,
                'notes' => $notes,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'photo_path' => $photoPath
            ]
        );

        Log::info('[ATTENDANCE] Clock-in by employee #{id}', [
            'id' => $employee->id,
            'name' => $employee->user->name,
            'time' => $currentTime,
            'status' => $status,
            'lat' => $request->latitude,
            'lng' => $request->longitude,
        ]);

        return response()->json(['success' => true, 'message' => 'Berhasil Clock In.', 'data' => $attendance]);
    }

    public function clockOut(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'photo' => 'nullable|string'
        ]);

        $employee = Auth::user()->employee;
        if (!$employee) return response()->json(['success' => false, 'message' => 'Not an employee'], 403);

        // Geofencing Check for Clock Out
        $settings = cache()->remember('company_settings_mapped', 86400, function () {
            $all = \App\Models\CompanySetting::all();
            $mappedData = [];
            foreach ($all as $setting) {
                $mappedData[$setting->key] = $setting->value;
            }
            return $mappedData;
        });

        $officeLat = $settings['office_latitude'] ?? -6.151595380868531;
        $officeLng = $settings['office_longitude'] ?? 106.77652147472021;
        $radius = $settings['office_radius'] ?? 50;

        $earthRadius = 6371000; // meters
        $latFrom = deg2rad((float)$request->latitude);
        $lonFrom = deg2rad((float)$request->longitude);
        $latTo = deg2rad((float)$officeLat);
        $lonTo = deg2rad((float)$officeLng);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) + cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
        $distance = $angle * $earthRadius;

        if ($distance > $radius) {
            return response()->json(['success' => false, 'message' => 'Anda berada di luar radius kantor (' . round($distance) . ' meter). Radius maksimal: ' . $radius . ' meter.'], 400);
        }

        $today = Carbon::today()->format('Y-m-d');
        $currentTime = Carbon::now()->format('H:i:s');

        $attendance = Attendance::where('employee_id', $employee->id)->where('date', $today)->first();
        if (!$attendance || !$attendance->clock_in) {
            return response()->json(['success' => false, 'message' => 'Anda belum melakukan clock in hari ini.'], 400);
        }

        $photoPath = $attendance->photo_path;
        if ($request->photo) {
            try {
                $image = $request->photo;
                $image = str_replace('data:image/jpeg;base64,', '', $image);
                $image = str_replace('data:image/png;base64,', '', $image);
                $image = str_replace(' ', '+', $image);
                $decoded = base64_decode($image);
                
                if ($decoded !== false && strlen($decoded) <= 10 * 1024 * 1024) {
                    $imageName = 'attendance_out_' . $employee->id . '_' . time() . '.png';
                    Storage::disk('public')->put('attendances/' . $imageName, $decoded);
                    $photoPath = 'attendances/' . $imageName;
                }
            } catch (\Exception $e) {
                // Ignore failure to ensure clock out completes
                Log::warning('[ATTENDANCE] Failed to save clock-out photo for employee #{id}', [
                    'id' => $employee->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $attendance->update([
            'clock_out' => $currentTime,
            'photo_path' => $photoPath ?? $attendance->photo_path
        ]);

        Log::info('[ATTENDANCE] Clock-out by employee #{id}', [
            'id' => $employee->id,
            'name' => $employee->user->name,
            'time' => $currentTime,
        ]);

        return response()->json(['success' => true, 'message' => 'Berhasil Clock Out.', 'data' => $attendance]);
    }
}
