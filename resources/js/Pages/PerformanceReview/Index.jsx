import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Star, FileText } from 'lucide-react';

export default function PerformanceReviewIndex({ auth }) {
    const [reviews, setReviews] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const isAdminOrHr = ['admin', 'hr'].includes(auth.user.role);

    const [form, setForm] = useState({
        employee_id: '',
        period_month: new Date().getMonth() + 1,
        period_year: new Date().getFullYear(),
        score: '',
        notes: ''
    });

    useEffect(() => {
        fetchReviews();
        if (isAdminOrHr) {
            fetchEmployees();
        }
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/performance-reviews');
            setReviews(response.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await axios.get('/api/v1/employees');
            setEmployees(response.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const submitForm = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/v1/performance-reviews', form);
            alert('Penilaian berhasil dikirim!');
            setForm({ ...form, employee_id: '', score: '', notes: '' });
            fetchReviews();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Gagal mengirim penilaian.');
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Penilaian Kinerja (KPI)</h2>}
        >
            <Head title="Penilaian Kinerja" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {isAdminOrHr && (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                                <Star size={20} className="text-yellow-500" /> Buat Penilaian Baru
                            </h3>
                            <form onSubmit={submitForm} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Karyawan</label>
                                        <select required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})}>
                                            <option value="">Pilih Karyawan</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.user?.name} ({emp.employee_code})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bulan Periode</label>
                                        <input type="number" required min="1" max="12" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.period_month} onChange={e => setForm({...form, period_month: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tahun Periode</label>
                                        <input type="number" required min="2000" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.period_year} onChange={e => setForm({...form, period_year: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Skor (1-100)</label>
                                        <input type="number" required min="1" max="100" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.score} onChange={e => setForm({...form, score: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Catatan / Ulasan Kinerja</label>
                                        <textarea required rows="3" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}></textarea>
                                    </div>
                                </div>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Simpan Penilaian</button>
                            </form>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                            <FileText size={20} /> Riwayat Penilaian
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Periode</th>
                                        {isAdminOrHr && <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Karyawan</th>}
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Skor KPI</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Penilai</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" className="p-4 text-center dark:text-gray-400">Memuat data...</td></tr>
                                    ) : reviews.length === 0 ? (
                                        <tr><td colSpan="5" className="p-4 text-center dark:text-gray-400">Belum ada data penilaian kinerja.</td></tr>
                                    ) : (
                                        reviews.map(review => (
                                            <tr key={review.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="p-4 font-medium text-gray-800 dark:text-gray-200">
                                                    {review.period_month} / {review.period_year}
                                                </td>
                                                {isAdminOrHr && (
                                                    <td className="p-4 text-gray-700 dark:text-gray-300">
                                                        {review.employee?.user?.name}
                                                    </td>
                                                )}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-1 font-bold text-gray-800 dark:text-gray-200">
                                                        <Star size={16} className={review.score >= 80 ? "text-yellow-500" : review.score >= 50 ? "text-gray-400" : "text-red-500"} /> 
                                                        {review.score}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                                    {review.reviewer?.name || 'Sistem'}
                                                </td>
                                                <td className="p-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                                    {review.notes}
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
        </AuthenticatedLayout>
    );
}
