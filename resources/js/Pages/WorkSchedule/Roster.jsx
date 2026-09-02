import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

export default function Roster({ auth }) {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    
    const [employees, setEmployees] = useState([]);
    const [workSchedules, setWorkSchedules] = useState([]);
    const [shifts, setShifts] = useState([]);
    
    useEffect(() => {
        fetchData();
    }, [month, year]);

    const fetchData = async () => {
        try {
            const [empRes, wsRes, shiftRes] = await Promise.all([
                axios.get('/api/v1/employees?limit=100'),
                axios.get('/api/v1/work-schedules'),
                axios.get(`/api/v1/employee-shifts?month=${month}&year=${year}`)
            ]);
            setEmployees(empRes.data.data.data || empRes.data.data);
            setWorkSchedules(wsRes.data.data);
            setShifts(shiftRes.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAssign = async (employeeId, dateStr, scheduleId) => {
        if (!scheduleId) return;
        try {
            await axios.post('/api/v1/employee-shifts', {
                employee_id: employeeId,
                work_schedule_id: scheduleId,
                date: dateStr
            });
            fetchData();
        } catch (error) {
            alert('Gagal assign roster');
        }
    };

    const getDaysInMonth = () => {
        return new Date(year, month, 0).getDate();
    };

    const days = Array.from({ length: getDaysInMonth() }, (_, i) => i + 1);

    const getShiftFor = (empId, day) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return shifts.find(s => s.employee_id === empId && s.date === dateStr);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Shift Roster Bulanan</h2>}
        >
            <Head title="Shift Roster" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            
                            <div className="flex gap-4 mb-6">
                                <select 
                                    value={month} onChange={(e) => setMonth(e.target.value)}
                                    className="border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md shadow-sm"
                                >
                                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>Bulan {m}</option>
                                    ))}
                                </select>
                                <input 
                                    type="number" value={year} onChange={(e) => setYear(e.target.value)}
                                    className="border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md shadow-sm"
                                />
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 border border-gray-700">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                            <th className="px-4 py-3 border">Karyawan</th>
                                            {days.map(d => (
                                                <th key={d} className="px-2 py-3 border text-center">{d}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map(emp => (
                                            <tr key={emp.id} className="border-b dark:border-gray-700">
                                                <td className="px-4 py-2 border font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                    {emp.user?.name}
                                                </td>
                                                {days.map(d => {
                                                    const shift = getShiftFor(emp.id, d);
                                                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                                    return (
                                                        <td key={d} className="border p-1">
                                                            <select
                                                                className="w-20 text-xs bg-gray-50 border border-gray-300 text-gray-900 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                                value={shift ? shift.work_schedule_id : ''}
                                                                onChange={(e) => handleAssign(emp.id, dateStr, e.target.value)}
                                                            >
                                                                <option value=""></option>
                                                                {workSchedules.map(ws => (
                                                                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
