import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PlusCircle, Download } from 'lucide-react';

export default function PayrollIndex({ auth }) {
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchPayrolls = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/v1/payrolls`, {
                params: { page, search }
            });
            setPayrolls(response.data.data.data);
            setTotalPages(response.data.data.last_page);
        } catch (error) {
            console.error("Error fetching payrolls", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayrolls();
    }, [page, search]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const handleGenerate = async () => {
        if (!confirm('Anda yakin ingin men-generate payroll untuk seluruh karyawan bulan ini? Data yang sudah ada untuk bulan ini akan ditimpa.')) return;
        
        try {
            const d = new Date();
            await axios.post('/api/v1/payrolls/generate', {
                month: d.getMonth() + 1,
                year: d.getFullYear()
            });
            fetchPayrolls();
            alert('Payroll berhasil di-generate!');
        } catch (error) {
            console.error('Error generating payroll', error);
            alert('Gagal men-generate payroll.');
        }
    };

    const handleApprove = async (id) => {
        if (!confirm('Anda yakin ingin menyetujui payroll ini?')) return;
        
        try {
            await axios.post(`/api/v1/payrolls/${id}/approve`);
            fetchPayrolls();
            alert('Payroll berhasil disetujui!');
        } catch (error) {
            alert('Gagal menyetujui payroll.');
        }
    };

    const handleDisburse = async (id) => {
        if (!confirm('Anda yakin ingin mencairkan dana (transfer) untuk payroll ini?')) return;
        
        try {
            await axios.post(`/api/v1/payrolls/${id}/disburse`);
            fetchPayrolls();
            alert('Dana berhasil dicairkan!');
        } catch (error) {
            console.error('Error disbursing payroll', error);
            alert(error.response?.data?.message || 'Gagal mencairkan dana.');
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Manajemen Payroll</h2>}
        >
            <Head title="Manajemen Payroll" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            
                            <div className="mb-6 flex justify-between items-center">
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Tabel Payroll Pegawai</h1>
                                <div className="flex gap-3">
                                    <a 
                                        href="/api/v1/payrolls/export" target="_blank" rel="noopener noreferrer"
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
                                    >
                                        <Download size={18} /> Export CSV
                                    </a>
                                    <button 
                                        onClick={handleGenerate}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
                                    >
                                        <PlusCircle size={18} /> Generate Payroll
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between">
                                    <input 
                                        type="text" 
                                        placeholder="Cari nama atau kode pegawai..." 
                                        className="px-4 py-2 border dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg w-1/3 focus:ring-2 focus:ring-blue-100 outline-none"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                                                <th className="p-4 font-semibold">Karyawan</th>
                                                <th className="p-4 font-semibold">Periode</th>
                                                <th className="p-4 font-semibold">Gaji Pokok</th>
                                                <th className="p-4 font-semibold">Total Bersih (Net)</th>
                                                <th className="p-4 font-semibold">Status</th>
                                                <th className="p-4 font-semibold text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {loading ? (
                                                <tr><td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">Memuat data...</td></tr>
                                            ) : payrolls.length === 0 ? (
                                                <tr><td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">Data tidak ditemukan.</td></tr>
                                            ) : (
                                                payrolls.map((item) => (
                                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                                        <td className="p-4">
                                                            <div className="font-medium text-gray-800 dark:text-gray-200">{item.employee?.user?.name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{item.employee?.department_id}</div>
                                                        </td>
                                                        <td className="p-4 text-gray-600 dark:text-gray-300">{item.period_month} / {item.period_year}</td>
                                                        <td className="p-4 text-gray-600 dark:text-gray-300">{formatCurrency(item.total_basic)}</td>
                                                        <td className="p-4 font-semibold text-green-600 dark:text-green-400">{formatCurrency(item.net_salary)}</td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                                item.status === 'paid' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' : 
                                                                item.status === 'approved' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
                                                            }`}>
                                                                {item.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-center space-x-2">
                                                            {item.status === 'draft' && auth.user?.role !== 'employee' && (
                                                                <button onClick={() => handleApprove(item.id)} className="text-yellow-500 hover:text-yellow-700 text-sm font-medium mr-2">Approve</button>
                                                            )}
                                                            {item.status === 'approved' && auth.user?.role !== 'employee' && (
                                                                <button onClick={() => handleDisburse(item.id)} className="text-green-500 hover:text-green-700 text-sm font-medium mr-2">Disburse</button>
                                                            )}
                                                            <Link href={`/payroll/${item.id}`} className="text-blue-500 hover:text-blue-700 text-sm font-medium">Detail</Link>
                                                            <a href={`/api/v1/payrolls/${item.id}/slip`} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-700 text-sm font-medium">PDF</a>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                                    <span>Halaman {page} dari {totalPages}</span>
                                    <div className="space-x-2">
                                        <button 
                                            disabled={page === 1}
                                            onClick={() => setPage(page - 1)}
                                            className="px-3 py-1 border dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                                        >
                                            Sebelumnya
                                        </button>
                                        <button 
                                            disabled={page === totalPages}
                                            onClick={() => setPage(page + 1)}
                                            className="px-3 py-1 border dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                                        >
                                            Selanjutnya
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
