import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

export default function OvertimeIndex({ auth }) {
    const [overtimes, setOvertimes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        date: '',
        start_time: '',
        end_time: '',
        reason: ''
    });

    const isEmployee = auth.user.role === 'employee';

    useEffect(() => {
        fetchOvertimes();
    }, []);

    const fetchOvertimes = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/overtimes');
            setOvertimes(response.data.data);
        } catch (error) {
            console.error("Error fetching overtimes", error);
        } finally {
            setLoading(false);
        }
    };

    const submitOvertime = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/v1/overtimes', form);
            alert('Lembur berhasil diajukan!');
            setForm({ date: '', start_time: '', end_time: '', reason: '' });
            fetchOvertimes();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Gagal mengajukan lembur.');
        }
    };

    const updateStatus = async (id, status) => {
        if (!confirm(`Anda yakin ingin memproses persetujuan ini?`)) return;
        try {
            await axios.put(`/api/v1/overtimes/${id}`, { status });
            fetchOvertimes();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Gagal mengupdate status.');
        }
    };

    const canApprove = (ot) => {
        if (!isEmployee) {
            return ot.status === 'pending_hr' || ot.status === 'pending';
        }
        return ot.employee?.user_id !== auth.user.id && ot.status === 'pending_manager';
    };

    const showActionColumn = !isEmployee || overtimes.some(canApprove);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Manajemen Lembur</h2>}
        >
            <Head title="Lembur" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {isEmployee && (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                                <Clock size={20} /> Form Pengajuan Lembur
                            </h3>
                            <form onSubmit={submitOvertime} className="space-y-4 max-w-2xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Lembur</label>
                                    <input type="date" required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jam Mulai</label>
                                        <input type="time" required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jam Selesai</label>
                                        <input type="time" required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Keterangan Pekerjaan</label>
                                    <textarea required rows="3" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}></textarea>
                                </div>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Ajukan Lembur</button>
                            </form>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Riwayat Lembur</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                        {!isEmployee || overtimes.some(ot => ot.employee?.user_id !== auth.user.id) ? (
                                            <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Karyawan</th>
                                        ) : null}
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Waktu</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Durasi</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Keterangan</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                        {showActionColumn && <th className="p-4 font-semibold text-gray-700 dark:text-gray-300 text-center">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="7" className="p-4 text-center dark:text-gray-400">Memuat data...</td></tr>
                                    ) : overtimes.length === 0 ? (
                                        <tr><td colSpan="7" className="p-4 text-center dark:text-gray-400">Belum ada data lembur.</td></tr>
                                    ) : (
                                        overtimes.map(ot => (
                                            <tr key={ot.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                {(!isEmployee || overtimes.some(o => o.employee?.user_id !== auth.user.id)) && (
                                                    <td className="p-4">
                                                        <div className="font-medium text-gray-800 dark:text-gray-200">{ot.employee?.user?.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{ot.employee?.employee_code}</div>
                                                    </td>
                                                )}
                                                <td className="p-4 whitespace-nowrap dark:text-gray-300">{ot.date}</td>
                                                <td className="p-4 whitespace-nowrap dark:text-gray-300">{ot.start_time.substring(0, 5)} - {ot.end_time.substring(0, 5)}</td>
                                                <td className="p-4 dark:text-gray-300 font-semibold">{ot.duration_hours} Jam</td>
                                                <td className="p-4 text-gray-600 dark:text-gray-400">{ot.reason}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                        ot.status === 'approved' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' :
                                                        ot.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400' : 
                                                        'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
                                                    }`}>
                                                        {ot.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                {showActionColumn && (
                                                    <td className="p-4 text-center space-x-2">
                                                        {canApprove(ot) && (
                                                            <>
                                                                <button onClick={() => updateStatus(ot.id, isEmployee ? 'pending_hr' : 'approved')} className="text-green-600 hover:text-green-800" title="Setujui"><CheckCircle size={20}/></button>
                                                                <button onClick={() => updateStatus(ot.id, 'rejected')} className="text-red-600 hover:text-red-800" title="Tolak"><XCircle size={20}/></button>
                                                            </>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
