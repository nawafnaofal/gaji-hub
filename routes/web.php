<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/careers', function () {
    return Inertia::render('Careers/Index');
})->name('careers');

Route::post('/api/v1/recruitment/public/apply', [\App\Http\Controllers\Api\RecruitmentController::class, 'applyPublic']);

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/payroll', function () {
    return Inertia::render('Payroll/Index');
})->middleware(['auth', 'verified'])->name('payroll');

Route::get('/payroll/{id}', function ($id) {
    return Inertia::render('Payroll/Show', ['payroll_id' => $id]);
})->middleware(['auth', 'verified'])->name('payroll.show');

Route::get('/my-payslips', function () {
    return Inertia::render('Payroll/MyPayslip');
})->middleware(['auth', 'verified'])->name('my-payslips');

Route::get('/employees', function () {
    return Inertia::render('Employee/Index');
})->middleware(['auth', 'verified', 'role:admin,hr'])->name('employees');

Route::get('/attendances', function () {
    return Inertia::render('Attendance/Index');
})->middleware(['auth', 'verified', 'role:admin,hr'])->name('attendances');

Route::get('/salary-components', function () {
    return Inertia::render('SalaryComponent/Index');
})->middleware(['auth', 'verified', 'role:admin,hr'])->name('salary-components');

Route::get('/settings', function () {
    return Inertia::render('Settings');
})->middleware(['auth', 'verified', 'role:admin,hr'])->name('settings');

// Employee & HR
Route::get('/leaves', function () {
    return Inertia::render('Leave/Index');
})->middleware(['auth', 'verified'])->name('leaves');

Route::get('/reimbursements', function () {
    return Inertia::render('Reimbursement/Index');
})->middleware(['auth', 'verified'])->name('reimbursements');

Route::get('/overtimes', function () {
    return Inertia::render('Overtime/Index');
})->middleware(['auth', 'verified'])->name('overtimes');

Route::get('/cash-advances', function () {
    return Inertia::render('CashAdvance/Index');
})->middleware(['auth', 'verified'])->name('cash-advances');

Route::get('/holidays', function () {
    return Inertia::render('Holiday/Index');
})->middleware(['auth', 'verified', 'role:admin,hr'])->name('holidays');

Route::get('/company-documents', function () {
    return Inertia::render('CompanyDocument/Index');
})->middleware(['auth', 'verified', 'role:admin,hr'])->name('company-documents');

Route::get('/recruitment', function () {
    return Inertia::render('Recruitment/Index');
})->middleware(['auth', 'verified', 'role:admin,hr'])->name('recruitment');

Route::get('/okr', function () {
    return Inertia::render('Okr/Index');
})->middleware(['auth', 'verified'])->name('okr');

Route::get('/assets', function () {
    return Inertia::render('Asset/Index');
})->middleware(['auth', 'verified'])->name('assets');

Route::get('/loans', function () {
    return Inertia::render('Loan/Index');
})->middleware(['auth', 'verified'])->name('loans');

Route::get('/performance-reviews', function () {
    return Inertia::render('PerformanceReview/Index');
})->middleware(['auth', 'verified'])->name('performance-reviews');

Route::get('/org-chart', function () {
    return Inertia::render('OrgChart/Index');
})->middleware(['auth', 'verified'])->name('org-chart');

Route::get('/announcements', function () {
    return Inertia::render('Announcement/Index');
})->middleware(['auth', 'verified', 'role:admin,hr'])->name('announcements');

Route::get('/audit-logs', function () {
    return Inertia::render('AuditLog/Index');
})->middleware(['auth', 'verified', 'role:admin'])->name('audit-logs');

Route::get('/work-schedules', function () {
    return Inertia::render('WorkSchedule/Index');
})->middleware(['auth', 'verified', 'role:admin,hr'])->name('work-schedules');

Route::get('/work-schedules/roster', function () {
    return Inertia::render('WorkSchedule/Roster');
})->middleware(['auth', 'verified', 'role:admin,hr'])->name('work-schedules.roster');

Route::get('/reports', function () {
    return Inertia::render('Report/Index');
})->middleware(['auth', 'verified', 'role:admin,hr'])->name('reports');

Route::get('/resignations', function () {
    return Inertia::render('Resignation/Index');
})->middleware(['auth', 'verified', 'role:admin,hr'])->name('resignations');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// JSON API Routes for Frontend (Uses Web Middleware for Session Auth)
Route::middleware('auth')->prefix('api/v1')->group(function () {
    
    // Admin & HR Only API
    Route::middleware('role:admin,hr')->group(function () {
        Route::get('/recruitment/positions', [\App\Http\Controllers\Api\RecruitmentController::class, 'getPositions']);
        Route::post('/recruitment/positions', [\App\Http\Controllers\Api\RecruitmentController::class, 'storePosition']);
        Route::get('/recruitment/applications', [\App\Http\Controllers\Api\RecruitmentController::class, 'getApplications']);
        Route::put('/recruitment/applications/{id}/status', [\App\Http\Controllers\Api\RecruitmentController::class, 'updateApplicationStatus']);

        Route::get('/okr', [\App\Http\Controllers\Api\OkrController::class, 'index']);
        Route::post('/okr', [\App\Http\Controllers\Api\OkrController::class, 'storeObjective']);
        Route::post('/okr/key-results', [\App\Http\Controllers\Api\OkrController::class, 'storeKeyResult']);
        Route::put('/okr/key-results/{id}/progress', [\App\Http\Controllers\Api\OkrController::class, 'updateProgress']);

        Route::get('/attendances/export', [\App\Http\Controllers\Api\AttendanceController::class, 'exportExcel']);
        Route::get('/attendances', [\App\Http\Controllers\Api\AttendanceController::class, 'index']);
        Route::post('/attendances', [\App\Http\Controllers\Api\AttendanceController::class, 'store']);
        Route::get('/employees', [\App\Http\Controllers\Api\EmployeeController::class, 'index']);
        Route::post('/employees', [\App\Http\Controllers\Api\EmployeeController::class, 'store']);
        Route::put('/employees/{id}', [\App\Http\Controllers\Api\EmployeeController::class, 'update']);
        Route::delete('/employees/{id}', [\App\Http\Controllers\Api\EmployeeController::class, 'destroy']);
        
        Route::get('/employees/{employeeId}/documents', [\App\Http\Controllers\Api\EmployeeDocumentController::class, 'index']);
        Route::post('/employees/{employeeId}/documents', [\App\Http\Controllers\Api\EmployeeDocumentController::class, 'store']);
        Route::delete('/documents/{id}', [\App\Http\Controllers\Api\EmployeeDocumentController::class, 'destroy']);
        
        Route::get('/payrolls', [\App\Http\Controllers\Api\PayrollController::class, 'index']);
        Route::get('/payrolls/export', [\App\Http\Controllers\Api\PayrollController::class, 'exportCsv']);
        Route::get('/payrolls/export/bank', [\App\Http\Controllers\Api\PayrollController::class, 'exportBankTransfer']);
        Route::post('/payrolls/generate', [\App\Http\Controllers\Api\PayrollController::class, 'generate']);
        Route::post('/payrolls/{id}/approve', [\App\Http\Controllers\Api\PayrollController::class, 'approve']);
        Route::post('/payrolls/{id}/disburse', [\App\Http\Controllers\Api\PayrollController::class, 'disburse']);
        Route::get('/dashboard/stats', [\App\Http\Controllers\Api\DashboardController::class, 'stats']);
        Route::get('/dashboard/approvals', [\App\Http\Controllers\Api\DashboardController::class, 'getApprovals']);

        Route::get('/settings', [\App\Http\Controllers\Api\CompanySettingController::class, 'index']);
        Route::post('/settings', [\App\Http\Controllers\Api\CompanySettingController::class, 'store']);
        
        Route::get('/salary-components', [\App\Http\Controllers\Api\SalaryComponentController::class, 'index']);
        Route::post('/salary-components', [\App\Http\Controllers\Api\SalaryComponentController::class, 'store']);

        // Work Schedule & Shift Roster
        Route::get('/work-schedules', [\App\Http\Controllers\WorkScheduleController::class, 'index']);
        Route::post('/work-schedules', [\App\Http\Controllers\WorkScheduleController::class, 'store']);
        Route::get('/employee-shifts', [\App\Http\Controllers\WorkScheduleController::class, 'getShifts']);
        Route::post('/employee-shifts', [\App\Http\Controllers\WorkScheduleController::class, 'assignShift']);
        
        Route::put('/leaves/{id}', [\App\Http\Controllers\Api\LeaveController::class, 'update']);
        Route::put('/reimbursements/{id}', [\App\Http\Controllers\Api\ReimbursementController::class, 'update']);
        Route::put('/overtimes/{id}', [\App\Http\Controllers\Api\OvertimeController::class, 'update']);
        Route::put('/cash-advances/{id}', [\App\Http\Controllers\Api\CashAdvanceController::class, 'update']);
        Route::delete('/cash-advances/{id}', [\App\Http\Controllers\Api\CashAdvanceController::class, 'destroy']);
        
        Route::get('/holidays', [\App\Http\Controllers\Api\HolidayController::class, 'index']);
        Route::post('/holidays', [\App\Http\Controllers\Api\HolidayController::class, 'store']);
        Route::delete('/holidays/{id}', [\App\Http\Controllers\Api\HolidayController::class, 'destroy']);

        Route::post('/announcements', [\App\Http\Controllers\Api\AnnouncementController::class, 'store']);
        Route::put('/announcements/{id}', [\App\Http\Controllers\Api\AnnouncementController::class, 'update']);
        Route::delete('/announcements/{id}', [\App\Http\Controllers\Api\AnnouncementController::class, 'destroy']);
        
        Route::post('/company-documents', [\App\Http\Controllers\CompanyDocumentController::class, 'store']);
        Route::delete('/company-documents/{id}', [\App\Http\Controllers\CompanyDocumentController::class, 'destroy']);
        
        Route::post('/assets', [\App\Http\Controllers\AssetController::class, 'store']);
        Route::put('/assets/{id}', [\App\Http\Controllers\AssetController::class, 'update']);
        Route::delete('/assets/{id}', [\App\Http\Controllers\AssetController::class, 'destroy']);
        
        Route::get('/audit-logs', [\App\Http\Controllers\Api\AuditLogController::class, 'index']);

        // Work Schedules (HR only)
        Route::get('/work-schedules', [\App\Http\Controllers\WorkScheduleController::class, 'index']);
        Route::post('/work-schedules', [\App\Http\Controllers\WorkScheduleController::class, 'store']);
        Route::put('/work-schedules/{id}', [\App\Http\Controllers\WorkScheduleController::class, 'update']);
        Route::delete('/work-schedules/{id}', [\App\Http\Controllers\WorkScheduleController::class, 'destroy']);
        Route::post('/work-schedules/assign', [\App\Http\Controllers\WorkScheduleController::class, 'assignToEmployee']);

        // Reports (HR only)
        Route::get('/reports/attendance', [\App\Http\Controllers\ReportController::class, 'attendance']);
        Route::get('/reports/payroll', [\App\Http\Controllers\ReportController::class, 'payroll']);
        Route::get('/reports/leave', [\App\Http\Controllers\ReportController::class, 'leave']);
        Route::get('/reports/overtime', [\App\Http\Controllers\ReportController::class, 'overtime']);
        Route::get('/reports/kpi', [\App\Http\Controllers\ReportController::class, 'kpi']);

        // Resignations & Offboarding
        Route::get('/resignations', [\App\Http\Controllers\ResignationController::class, 'index']);
        Route::post('/resignations', [\App\Http\Controllers\ResignationController::class, 'store']);
        Route::put('/resignations/{id}', [\App\Http\Controllers\ResignationController::class, 'update']);

        // Company Settings - signature upload
        Route::post('/settings/signature', [\App\Http\Controllers\Api\CompanySettingController::class, 'uploadSignature']);
    });
    
    // Shared API
    Route::middleware('auth')->group(function () {
        Route::get('/employees', [\App\Http\Controllers\Api\EmployeeController::class, 'index']);
        Route::get('/announcements', [\App\Http\Controllers\Api\AnnouncementController::class, 'index']);
        
        // Notifications
        Route::get('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
        Route::put('/notifications/mark-all-read', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
        Route::put('/notifications/{id}/mark-read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
        
        Route::get('/company-documents', [\App\Http\Controllers\CompanyDocumentController::class, 'index']);
        Route::get('/assets', [\App\Http\Controllers\AssetController::class, 'index']);

        // Cash advances (all roles)
        Route::get('/cash-advances', [\App\Http\Controllers\Api\CashAdvanceController::class, 'index']);
        Route::post('/cash-advances', [\App\Http\Controllers\Api\CashAdvanceController::class, 'store']);

        // Loans (all roles)
        Route::get('/loans', [\App\Http\Controllers\LoanController::class, 'index']);
        Route::post('/loans', [\App\Http\Controllers\LoanController::class, 'store']);

        // Performance reviews (all roles - index only)
        Route::get('/performance-reviews', [\App\Http\Controllers\PerformanceReviewController::class, 'index']);
    });

    Route::put('/loans/{id}/status', [\App\Http\Controllers\LoanController::class, 'updateStatus'])->middleware('role:admin,hr');
    Route::post('/performance-reviews', [\App\Http\Controllers\PerformanceReviewController::class, 'store'])->middleware('role:admin,hr');
    Route::get('/org-chart', [\App\Http\Controllers\OrgChartController::class, 'index']);
    Route::put('/org-chart/{id}', [\App\Http\Controllers\OrgChartController::class, 'update'])->middleware('role:admin,hr');
    
    Route::get('/dashboard/stats', [\App\Http\Controllers\Api\DashboardController::class, 'stats'])->withoutMiddleware('role:admin,hr');
    Route::get('/leaves', [\App\Http\Controllers\Api\LeaveController::class, 'index']);
    Route::post('/leaves', [\App\Http\Controllers\Api\LeaveController::class, 'store']);
    Route::get('/reimbursements', [\App\Http\Controllers\Api\ReimbursementController::class, 'index']);
    Route::post('/reimbursements', [\App\Http\Controllers\Api\ReimbursementController::class, 'store']);
    Route::get('/overtimes', [\App\Http\Controllers\Api\OvertimeController::class, 'index']);
    Route::post('/overtimes', [\App\Http\Controllers\Api\OvertimeController::class, 'store']);
    
    Route::post('/attendances/clock-in', [\App\Http\Controllers\Api\AttendanceController::class, 'clockIn']);
    Route::post('/attendances/clock-out', [\App\Http\Controllers\Api\AttendanceController::class, 'clockOut']);
    
    Route::get('/payrolls/{id}', [\App\Http\Controllers\Api\PayrollController::class, 'show']);
    Route::get('/payrolls/{id}/slip', [\App\Http\Controllers\Api\PayrollController::class, 'downloadSlip']);
});

require __DIR__.'/auth.php';
