<?php

namespace App\Exports;

use App\Models\Attendance;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class AttendancesExport implements FromQuery, WithHeadings, WithMapping
{
    protected $month;
    protected $year;

    public function __construct($month = null, $year = null)
    {
        $this->month = $month;
        $this->year = $year;
    }

    public function query()
    {
        $query = Attendance::with('employee.user')->orderBy('date', 'desc');

        if ($this->month) {
            $query->whereMonth('date', $this->month);
        }
        
        if ($this->year) {
            $query->whereYear('date', $this->year);
        }

        return $query;
    }

    public function headings(): array
    {
        return [
            'ID Absensi',
            'Nama Karyawan',
            'Kode Pegawai',
            'Tanggal',
            'Clock In',
            'Clock Out',
            'Status'
        ];
    }

    public function map($attendance): array
    {
        return [
            $attendance->id,
            $attendance->employee->user->name,
            $attendance->employee->employee_code,
            $attendance->date,
            $attendance->clock_in,
            $attendance->clock_out,
            $attendance->status,
        ];
    }
}
