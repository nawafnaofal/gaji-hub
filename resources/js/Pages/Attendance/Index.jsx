import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Clock, Eye, MapPin, X } from 'lucide-react';

export default function AttendanceIndex({ auth }) {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedDetail, setSelectedDetail] = useState(null);

    useEffect(() => {
        fetchData();
    }, [date]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/attendances', { params: { date } });
            setEmployees(response.data.data);
        } catch (error) {
            console.error("Error fetching attendances", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (employeeId, status) => {
        try {
            await axios.post('/api/v1/attendances', {
                employee_id: employeeId,
                date: date,
                status: status
            });
            fetchData();
        } catch (error) {
            console.error("Error updating attendance", error);
            alert('Gagal mengupdate absensi');
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Kehadiran (Absensi)</h2>}
        >
            <Head title="Absensi Karyawan" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Clock size={20} /> Rekap Absensi Harian
                                </h3>
                                <div className="flex items-center gap-4">
                                    <a 
                                        href={`/api/v1/attendances/export?month=${date.split('-')[1]}&year=${date.split('-')[0]}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2"
                                    >
                                        Export Excel
                                    </a>
                                    <div className="flex items-center gap-2">
                                        <label className="font-semibold text-gray-700 dark:text-gray-300">Tanggal:</label>
                                        <input 
                                            type="date" 
                                            value={date} 
                                            onChange={(e) => setDate(e.target.value)}
                                            className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                            <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Nama Karyawan</th>
                                            <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Departemen</th>
                                            <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Status Kehadiran</th>
                                            <th className="p-4 font-semibold text-gray-700 dark:text-gray-300 text-center">Aksi (Ubah Status)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="4" className="p-4 text-center text-gray-500 dark:text-gray-400">Memuat data absensi...</td>
                                            </tr>
                                        ) : employees.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="p-4 text-center text-gray-500 dark:text-gray-400">Belum ada karyawan.</td>
                                            </tr>
                                        ) : (
                                            employees.map(emp => (
                                                <tr key={emp.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="p-4">
                                                        <div className="font-medium text-gray-800 dark:text-gray-200">{emp.user?.name}</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{emp.employee_code}</div>
                                                    </td>
                                                    <td className="p-4 text-gray-600 dark:text-gray-300">{emp.department_id}</td>
                                                    <td className="p-4">
                                                        {emp.attendance ? (
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                                emp.attendance.status === 'present' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' :
                                                                emp.attendance.status === 'leave' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' :
                                                                emp.attendance.status === 'late' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400' :
                                                                'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                                                            }`}>
                                                                {emp.attendance.status.toUpperCase()}
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                                BELUM DIISI
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 flex items-center justify-center space-x-2">
                                                        {emp.attendance && (emp.attendance.photo_url || (emp.attendance.latitude && emp.attendance.longitude)) && (
                                                            <button 
                                                                onClick={() => setSelectedDetail(emp)} 
                                                                className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 flex items-center gap-1 rounded"
                                                            >
                                                                <Eye size={14} /> Detail
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleStatusChange(emp.id, 'present')} className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded">Hadir</button>
                                                        <button onClick={() => handleStatusChange(emp.id, 'late')} className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded">Telat</button>
                                                        <button onClick={() => handleStatusChange(emp.id, 'leave')} className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded">Cuti</button>
                                                        <button onClick={() => handleStatusChange(emp.id, 'absent')} className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">Alpa</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Detail Absensi */}
            {selectedDetail && selectedDetail.attendance && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
                        <button 
                            onClick={() => setSelectedDetail(null)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <X size={20} />
                        </button>
                        
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 border-b dark:border-gray-700 pb-2">
                            Detail Absensi: {selectedDetail.user?.name}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Waktu Clock In</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedDetail.attendance.clock_in || '-'}</p>
                            </div>
                            
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Foto Selfie Absen</p>
                                {selectedDetail.attendance.photo_url ? (
                                    <div className="mt-2 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border dark:border-gray-600 flex justify-center">
                                        <img 
                                            src={selectedDetail.attendance.photo_url} 
                                            alt="Foto Absen" 
                                            className="max-h-48 object-contain"
                                        />
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-500 italic mt-1">Tidak ada foto.</p>
                                )}
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Lokasi Absen (GPS)</p>
                                {selectedDetail.attendance.latitude && selectedDetail.attendance.longitude ? (
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                            Lat: {selectedDetail.attendance.latitude}, Lng: {selectedDetail.attendance.longitude}
                                        </p>
                                        <a 
                                            href={`https://www.google.com/maps/search/?api=1&query=${selectedDetail.attendance.latitude},${selectedDetail.attendance.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 px-4 py-2 rounded-md transition font-semibold justify-center"
                                        >
                                            <MapPin size={16} /> Buka di Google Maps
                                        </a>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-500 italic mt-1">Data lokasi tidak tersedia.</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
