import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PlusCircle, Search, Download, X } from 'lucide-react';
import Modal from '@/Components/Modal';

export default function PayrollIndex({ auth }) {
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

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
            alert(error.response?.data?.message || 'Gagal men-generate payroll.');
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
                                        href={`/api/v1/payrolls/export/bank?month=${month}&year=${year}`} target="_blank" rel="noopener noreferrer"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
                                    >
                                        <Download size={18} /> Transfer Bank
                                    </a>
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
                                                            <button onClick={() => setSelectedPayroll(item)} className="text-blue-500 hover:text-blue-700 text-sm font-medium mr-2">Detail</button>
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

            <Modal show={selectedPayroll !== null} onClose={() => setSelectedPayroll(null)} maxWidth="2xl">
                {selectedPayroll && (() => {
                    const details = typeof selectedPayroll.details === 'string' ? JSON.parse(selectedPayroll.details) : (selectedPayroll.details || {});
                    return (
                    <div className="p-6">
                        <div className="flex justify-between items-start border-b pb-4 mb-4">
                            <div>
                                <h3 className="text-2xl font-bold dark:text-gray-100">{selectedPayroll.employee?.user?.name}</h3>
                                <p className="text-gray-500 dark:text-gray-400">ID Karyawan: {selectedPayroll.employee?.employee_code}</p>
                                <p className="text-gray-500 dark:text-gray-400">Departemen: {selectedPayroll.employee?.department_id}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-gray-700 dark:text-gray-300">Periode</p>
                                <p className="text-xl dark:text-gray-200">{selectedPayroll.period_month} / {selectedPayroll.period_year}</p>
                                <span className={`inline-block mt-2 px-3 py-1 text-sm font-semibold rounded-full ${
                                    selectedPayroll.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 
                                    selectedPayroll.status === 'approved' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
                                }`}>
                                    {selectedPayroll.status.toUpperCase()}
                                </span>
                            </div>
                            <button onClick={() => setSelectedPayroll(null)} className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold text-lg mb-2 dark:text-gray-200">1. Pendapatan</h4>
                                <table className="w-full border dark:border-gray-700 text-left">
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        <tr>
                                            <td className="p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-300 w-2/3">Gaji Pokok</td>
                                            <td className="p-3 font-medium text-right dark:text-gray-200">{formatCurrency(selectedPayroll.total_basic)}</td>
                                        </tr>
                                        {details?.allowances?.transport > 0 && (
                                            <tr>
                                                <td className="p-3 bg-gray-50 dark:bg-gray-800 w-2/3 pl-8 text-sm text-gray-600 dark:text-gray-400">Tunjangan Transportasi</td>
                                                <td className="p-3 font-medium text-right text-sm dark:text-gray-300">{formatCurrency(details.allowances.transport)}</td>
                                            </tr>
                                        )}
                                        {details?.allowances?.meal > 0 && (
                                            <tr>
                                                <td className="p-3 bg-gray-50 dark:bg-gray-800 w-2/3 pl-8 text-sm text-gray-600 dark:text-gray-400">Tunjangan Makan</td>
                                                <td className="p-3 font-medium text-right text-sm dark:text-gray-300">{formatCurrency(details.allowances.meal)}</td>
                                            </tr>
                                        )}
                                        {details?.allowances?.overtime > 0 && (
                                            <tr>
                                                <td className="p-3 bg-gray-50 dark:bg-gray-800 w-2/3 pl-8 text-sm text-gray-600 dark:text-gray-400">Uang Lembur (Overtime)</td>
                                                <td className="p-3 font-medium text-right text-sm dark:text-gray-300">{formatCurrency(details.allowances.overtime)}</td>
                                            </tr>
                                        )}
                                        {details?.allowances?.reimbursement > 0 && (
                                            <tr>
                                                <td className="p-3 bg-gray-50 dark:bg-gray-800 w-2/3 pl-8 text-sm text-gray-600 dark:text-gray-400">Reimbursement (Klaim)</td>
                                                <td className="p-3 font-medium text-right text-sm dark:text-gray-300">{formatCurrency(details.allowances.reimbursement)}</td>
                                            </tr>
                                        )}
                                        <tr className="bg-gray-100 dark:bg-gray-700">
                                            <td className="p-3 font-semibold text-gray-700 dark:text-gray-200 w-2/3">Total Pendapatan Tambahan</td>
                                            <td className="p-3 font-bold text-right dark:text-gray-100">{formatCurrency(selectedPayroll.total_allowance)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div>
                                <h4 className="font-bold text-lg mb-2 dark:text-gray-200">2. Potongan</h4>
                                <table className="w-full border dark:border-gray-700 text-left">
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {details?.deductions?.late_penalty > 0 && (
                                            <tr>
                                                <td className="p-3 bg-gray-50 dark:bg-gray-800 w-2/3 pl-8 text-sm text-gray-600 dark:text-gray-400">Denda Keterlambatan</td>
                                                <td className="p-3 font-medium text-red-600 dark:text-red-400 text-right text-sm">- {formatCurrency(details.deductions.late_penalty)}</td>
                                            </tr>
                                        )}
                                        {details?.deductions?.absence_penalty > 0 && (
                                            <tr>
                                                <td className="p-3 bg-gray-50 dark:bg-gray-800 w-2/3 pl-8 text-sm text-gray-600 dark:text-gray-400">Potongan Absen</td>
                                                <td className="p-3 font-medium text-red-600 dark:text-red-400 text-right text-sm">- {formatCurrency(details.deductions.absence_penalty)}</td>
                                            </tr>
                                        )}
                                        {details?.deductions?.bpjs_kesehatan > 0 && (
                                            <tr>
                                                <td className="p-3 bg-gray-50 dark:bg-gray-800 w-2/3 pl-8 text-sm text-gray-600 dark:text-gray-400">BPJS Kesehatan (1%)</td>
                                                <td className="p-3 font-medium text-red-600 dark:text-red-400 text-right text-sm">- {formatCurrency(details.deductions.bpjs_kesehatan)}</td>
                                            </tr>
                                        )}
                                        {details?.deductions?.bpjs_tk_jht > 0 && (
                                            <tr>
                                                <td className="p-3 bg-gray-50 dark:bg-gray-800 w-2/3 pl-8 text-sm text-gray-600 dark:text-gray-400">BPJS TK JHT (2%)</td>
                                                <td className="p-3 font-medium text-red-600 dark:text-red-400 text-right text-sm">- {formatCurrency(details.deductions.bpjs_tk_jht)}</td>
                                            </tr>
                                        )}
                                        {details?.deductions?.pph21 > 0 && (
                                            <tr>
                                                <td className="p-3 bg-gray-50 dark:bg-gray-800 w-2/3 pl-8 text-sm text-gray-600 dark:text-gray-400">PPh 21</td>
                                                <td className="p-3 font-medium text-red-600 dark:text-red-400 text-right text-sm">- {formatCurrency(details.deductions.pph21)}</td>
                                            </tr>
                                        )}
                                        {details?.deductions?.bpjs_tk_jp > 0 && (
                                            <tr>
                                                <td className="p-3 bg-gray-50 dark:bg-gray-800 w-2/3 pl-8 text-sm text-gray-600 dark:text-gray-400">BPJS TK JP (1%)</td>
                                                <td className="p-3 font-medium text-red-600 dark:text-red-400 text-right text-sm">- {formatCurrency(details.deductions.bpjs_tk_jp)}</td>
                                            </tr>
                                        )}
                                        {details?.deductions?.cash_advance > 0 && (
                                            <tr>
                                                <td className="p-3 bg-gray-50 dark:bg-gray-800 w-2/3 pl-8 text-sm text-gray-600 dark:text-gray-400">Potongan Kasbon</td>
                                                <td className="p-3 font-medium text-red-600 dark:text-red-400 text-right text-sm">- {formatCurrency(details.deductions.cash_advance)}</td>
                                            </tr>
                                        )}
                                        {details?.deductions?.loan_installment > 0 && (
                                            <tr>
                                                <td className="p-3 bg-gray-50 dark:bg-gray-800 w-2/3 pl-8 text-sm text-gray-600 dark:text-gray-400">Cicilan Pinjaman</td>
                                                <td className="p-3 font-medium text-red-600 dark:text-red-400 text-right text-sm">- {formatCurrency(details.deductions.loan_installment)}</td>
                                            </tr>
                                        )}
                                        <tr className="bg-gray-100 dark:bg-gray-700">
                                            <td className="p-3 font-semibold text-gray-700 dark:text-gray-200 w-2/3">Total Potongan</td>
                                            <td className="p-3 font-bold text-red-600 dark:text-red-400 text-right">- {formatCurrency(selectedPayroll.total_deduction)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg flex justify-between items-center mt-6">
                                <h4 className="font-bold text-xl text-blue-900 dark:text-blue-300">Total Gaji Bersih (Take Home Pay)</h4>
                                <p className="font-bold text-2xl text-green-600 dark:text-green-400">{formatCurrency(selectedPayroll.net_salary)}</p>
                            </div>
                        </div>
                        
                        <div className="mt-8 flex justify-end">
                            <a 
                                href={`/api/v1/payrolls/${selectedPayroll.id}/slip`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition"
                            >
                                Download Slip Gaji (PDF)
                            </a>
                        </div>
                    </div>
                    );
                })()}
            </Modal>
        </AuthenticatedLayout>
    );
}
