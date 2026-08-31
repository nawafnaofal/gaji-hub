import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Banknote, CheckCircle, XCircle } from 'lucide-react';

export default function LoanIndex({ auth }) {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    const isEmployee = auth.user.role === 'employee';

    const [form, setForm] = useState({
        amount: '',
        duration_months: '',
        reason: ''
    });

    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/loans');
            setLoans(response.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const submitForm = async (e) => {
        e.preventDefault();
        if (form.amount < 100000) {
            alert('Minimal pinjaman adalah Rp 100.000');
            return;
        }
        try {
            await axios.post('/api/v1/loans', form);
            alert('Pengajuan pinjaman berhasil dikirim!');
            setForm({ amount: '', duration_months: '', reason: '' });
            fetchLoans();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Gagal mengajukan pinjaman.');
        }
    };

    const updateStatus = async (id, status) => {
        if (!confirm(`Yakin ingin mengubah status menjadi ${status}?`)) return;
        try {
            await axios.put(`/api/v1/loans/${id}/status`, { status });
            fetchLoans();
        } catch (error) {
            console.error(error);
            alert('Gagal mengubah status.');
        }
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Pinjaman Karyawan (Fasilitas Cicilan)</h2>}
        >
            <Head title="Pinjaman Karyawan" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {isEmployee && (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                                <Banknote size={20} /> Ajukan Pinjaman Baru
                            </h3>
                            <form onSubmit={submitForm} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Pinjaman (Rp)</label>
                                        <input type="number" required min="100000" step="1000" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="Contoh: 5000000" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Durasi (Bulan)</label>
                                        <input type="number" required min="1" max="60" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.duration_months} onChange={e => setForm({...form, duration_months: e.target.value})} placeholder="Contoh: 12" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tujuan Pinjaman</label>
                                        <textarea required rows="2" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Penjelasan singkat tujuan pinjaman..."></textarea>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Estimasi Cicilan per Bulan (Bunga 0%):</p>
                                    <p className="text-lg text-blue-600 font-bold">
                                        {form.amount && form.duration_months ? formatRupiah(form.amount / form.duration_months) : 'Rp 0'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">*Cicilan ini akan otomatis dipotong dari Slip Gaji bulanan Anda jika disetujui.</p>
                                </div>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Kirim Pengajuan</button>
                            </form>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Daftar Pinjaman</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                        {!isEmployee && <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Nama Karyawan</th>}
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Total Pinjaman</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Cicilan / Bln</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Sisa Pinjaman</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                        {!isEmployee && <th className="p-4 font-semibold text-gray-700 dark:text-gray-300 text-center">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="6" className="p-4 text-center dark:text-gray-400">Memuat data...</td></tr>
                                    ) : loans.length === 0 ? (
                                        <tr><td colSpan="6" className="p-4 text-center dark:text-gray-400">Tidak ada pengajuan pinjaman.</td></tr>
                                    ) : (
                                        loans.map(loan => (
                                            <tr key={loan.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                {!isEmployee && (
                                                    <td className="p-4 font-medium text-gray-800 dark:text-gray-200">
                                                        {loan.employee?.user?.name}
                                                    </td>
                                                )}
                                                <td className="p-4 text-gray-700 dark:text-gray-300">
                                                    {formatRupiah(loan.amount)}
                                                    <div className="text-xs text-gray-500">Tenor: {loan.duration_months} Bln</div>
                                                </td>
                                                <td className="p-4 font-semibold text-red-500">
                                                    -{formatRupiah(loan.monthly_installment)}
                                                </td>
                                                <td className="p-4 font-bold text-gray-800 dark:text-gray-200">
                                                    {formatRupiah(loan.remaining_amount)}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                        loan.status === 'approved' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' :
                                                        loan.status === 'paid_off' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' :
                                                        loan.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400' :
                                                        'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                                                    }`}>
                                                        {loan.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                {!isEmployee && (
                                                    <td className="p-4 text-center space-x-2">
                                                        {loan.status === 'pending' && (
                                                            <>
                                                                <button onClick={() => updateStatus(loan.id, 'approved')} className="text-green-600 hover:text-green-800" title="Setujui"><CheckCircle size={20}/></button>
                                                                <button onClick={() => updateStatus(loan.id, 'rejected')} className="text-red-600 hover:text-red-800" title="Tolak"><XCircle size={20}/></button>
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
