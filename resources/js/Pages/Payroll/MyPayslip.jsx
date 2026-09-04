import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Wallet, Download, Calendar, ArrowUpRight, ArrowDownRight, Eye, FileText, CheckCircle, Clock } from 'lucide-react';
import Modal from '@/Components/Modal';

export default function MyPayslip({ auth }) {
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [search, setSearch] = useState('');
    const isAdminOrHr = ['admin', 'hr'].includes(auth?.user?.role);
    const hasEmployeeRecord = !!auth?.user?.employee;

    const fetchMyPayrolls = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/v1/payrolls', {
                params: { 
                    year: selectedYear,
                    search: search 
                }
            });
            setPayrolls(res.data.data.data || res.data.data || []);
        } catch (error) {
            console.error("Error fetching my payslips", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchMyPayrolls();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [selectedYear, search]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);
    };

    const getMonthName = (m) => {
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return months[m - 1] || `Bulan ${m}`;
    };

    const latestPayroll = payrolls[0] || null;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                {isAdminOrHr && !hasEmployeeRecord ? 'Daftar Slip Gaji Karyawan' : 'Slip Gaji Saya'}
            </h2>}
        >
            <Head title={isAdminOrHr && !hasEmployeeRecord ? "Daftar Slip Gaji Karyawan" : "Slip Gaji Saya"} />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header Banner & Filter */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold mb-2">
                                <Wallet size={14} /> Dokumen Resmi Penggajian
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold">
                                {isAdminOrHr && !hasEmployeeRecord ? 'Riwayat Slip Gaji Karyawan' : 'Riwayat Slip Gaji & Penghasilan'}
                            </h1>
                            <p className="text-blue-100 text-sm mt-1">
                                {isAdminOrHr && !hasEmployeeRecord 
                                    ? 'Kelola, pratinjau, dan unduh dokumen slip gaji seluruh karyawan perusahaan.' 
                                    : 'Transparan, aman, dan dapat diunduh kapan saja dalam format PDF resmi.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20">
                            <Calendar size={18} className="text-blue-200" />
                            <select 
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="bg-transparent text-white font-semibold border-none focus:ring-0 text-sm cursor-pointer pr-8"
                            >
                                {[0, 1, 2].map(offset => {
                                    const y = new Date().getFullYear() - offset;
                                    return <option key={y} value={y} className="text-gray-800">Tahun {y}</option>;
                                })}
                            </select>
                        </div>
                    </div>

                    {/* Quick KPI Cards (Latest Month) - Show only for individual employee */}
                    {latestPayroll && (!isAdminOrHr || hasEmployeeRecord) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Take Home Pay Terakhir</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                            {formatCurrency(latestPayroll.net_salary)}
                                        </p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                                            Periode {getMonthName(latestPayroll.period_month)} {latestPayroll.period_year}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                                        <Wallet size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Tunjangan & Lembur</p>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                            {formatCurrency(latestPayroll.total_allowance)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Gaji Pokok: {formatCurrency(latestPayroll.total_basic)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                                        <ArrowUpRight size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Potongan (Pajak, BPJS, Kasbon)</p>
                                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                                            {formatCurrency(latestPayroll.total_deduction)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Status: <span className="uppercase font-semibold">{latestPayroll.status}</span>
                                        </p>
                                    </div>
                                    <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                                        <ArrowDownRight size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table List of Payslips */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                                    {isAdminOrHr && !hasEmployeeRecord ? 'Daftar Slip Gaji Seluruh Karyawan' : 'Daftar Slip Gaji'} ({selectedYear})
                                </h3>
                                {isAdminOrHr && !hasEmployeeRecord && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Nama karyawan dan departemen pemilik slip gaji tercantum jelas pada setiap baris.
                                    </p>
                                )}
                            </div>
                            
                            {isAdminOrHr && (
                                <div className="w-full md:w-72">
                                    <input 
                                        type="text" 
                                        placeholder="Cari nama atau NIK karyawan..." 
                                        className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b dark:border-gray-700">
                                        {(isAdminOrHr && !hasEmployeeRecord) && (
                                            <th className="p-4 font-semibold">Nama Karyawan</th>
                                        )}
                                        <th className="p-4 font-semibold">Periode Bulan</th>
                                        <th className="p-4 font-semibold">Gaji Pokok</th>
                                        <th className="p-4 font-semibold">Tunjangan</th>
                                        <th className="p-4 font-semibold">Potongan</th>
                                        <th className="p-4 font-semibold">Gaji Bersih (Net)</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={(isAdminOrHr && !hasEmployeeRecord) ? "8" : "7"} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                Memuat data slip gaji...
                                            </td>
                                        </tr>
                                    ) : payrolls.length === 0 ? (
                                        <tr>
                                            <td colSpan={(isAdminOrHr && !hasEmployeeRecord) ? "8" : "7"} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                Belum ada slip gaji yang dirilis untuk tahun {selectedYear}.
                                            </td>
                                        </tr>
                                    ) : (
                                        payrolls.map((p) => (
                                            <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition">
                                                {(isAdminOrHr && !hasEmployeeRecord) && (
                                                    <td className="p-4">
                                                        <div className="font-semibold text-gray-900 dark:text-white">
                                                            {p.employee?.user?.name || 'Karyawan'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {p.employee?.employee_code} • {p.employee?.department || p.employee?.department_id || p.employee?.job_title || '-'}
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="p-4 font-medium text-gray-900 dark:text-white">
                                                    {getMonthName(p.period_month)} {p.period_year}
                                                </td>
                                                <td className="p-4 text-gray-600 dark:text-gray-300">
                                                    {formatCurrency(p.total_basic)}
                                                </td>
                                                <td className="p-4 text-green-600 dark:text-green-400 font-medium">
                                                    +{formatCurrency(p.total_allowance)}
                                                </td>
                                                <td className="p-4 text-red-600 dark:text-red-400 font-medium">
                                                    -{formatCurrency(p.total_deduction)}
                                                </td>
                                                <td className="p-4 font-bold text-gray-900 dark:text-white">
                                                    {formatCurrency(p.net_salary)}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                                                        p.status === 'paid' 
                                                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' 
                                                            : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                                    }`}>
                                                        {p.status === 'paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                        {p.status === 'paid' ? 'Dibayarkan' : 'Disetujui'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setSelectedPayroll(p)}
                                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                                                        >
                                                            <Eye size={14} /> Detail
                                                        </button>
                                                        <a
                                                            href={`/api/v1/payrolls/${p.id}/slip`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition shadow-sm"
                                                        >
                                                            <Download size={14} /> Unduh PDF
                                                        </a>
                                                    </div>
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

            {/* Modal Detail Slip Gaji */}
            <Modal show={selectedPayroll !== null} onClose={() => setSelectedPayroll(null)} maxWidth="2xl">
                {selectedPayroll && (
                    <div className="p-6 text-gray-900 dark:text-gray-100">
                        <div className="flex justify-between items-start border-b dark:border-gray-700 pb-4 mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Rincian Slip Gaji: {getMonthName(selectedPayroll.period_month)} {selectedPayroll.period_year}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {selectedPayroll.employee?.user?.name} ({selectedPayroll.employee?.employee_code})
                                </p>
                            </div>
                            <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded-full text-xs font-bold uppercase">
                                {selectedPayroll.status}
                            </span>
                        </div>

                        {/* Breakdown Component */}
                        {(() => {
                            const details = typeof selectedPayroll.details === 'string' 
                                ? JSON.parse(selectedPayroll.details || '{}') 
                                : (selectedPayroll.details || {});
                            const allowances = details.allowances || {};
                            const deductions = details.deductions || {};
                            const benefits = details.benefits || {};
                            const attendance = details.attendance_summary || {};

                            return (
                                <div className="space-y-4 my-4">
                                    {/* Attendance Mini Bar */}
                                    {attendance && (
                                        <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-300">
                                            <span>📅 Kehadiran: <strong className="text-gray-900 dark:text-white">{attendance.present_days ?? '-'} hari</strong></span>
                                            {Number(attendance.late_days || 0) > 0 && <span>⚠️ Terlambat: <strong className="text-amber-600">{attendance.late_days} hari</strong></span>}
                                            {Number(attendance.absent_days || 0) > 0 && <span>❌ Alpa: <strong className="text-red-600">{attendance.absent_days} hari</strong></span>}
                                            {Number(attendance.overtime_hours || 0) > 0 && <span>⏰ Lembur: <strong className="text-blue-600">{attendance.overtime_hours} jam</strong></span>}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Pendapatan (Earnings) */}
                                        <div className="bg-gray-50 dark:bg-gray-800/80 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-green-700 dark:text-green-400 mb-3 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Penghasilan (Earnings)
                                                </h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">Gaji Pokok</span>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(selectedPayroll.total_basic)}</span>
                                                    </div>
                                                    {Number(allowances.transport || 0) > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">Tunjangan Transport</span>
                                                            <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(allowances.transport)}</span>
                                                        </div>
                                                    )}
                                                    {Number(allowances.meal || 0) > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">Tunjangan Makan</span>
                                                            <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(allowances.meal)}</span>
                                                        </div>
                                                    )}
                                                    {Number(allowances.overtime || 0) > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">Upah Lembur (Overtime)</span>
                                                            <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(allowances.overtime)}</span>
                                                        </div>
                                                    )}
                                                    {Number(allowances.reimbursement || 0) > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">Klaim (Reimbursement)</span>
                                                            <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(allowances.reimbursement)}</span>
                                                        </div>
                                                    )}
                                                    {Object.entries(allowances).map(([k, val]) => {
                                                        if (['transport', 'meal', 'overtime', 'reimbursement'].includes(k) || !val) return null;
                                                        return (
                                                            <div key={k} className="flex justify-between">
                                                                <span className="text-gray-600 dark:text-gray-400 capitalize">{k.replace(/_/g, ' ')}</span>
                                                                <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(val)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="border-t dark:border-gray-700 pt-3 mt-4 flex justify-between font-bold text-green-600 dark:text-green-400">
                                                <span>Total Penghasilan Bruto</span>
                                                <span>{formatCurrency(Number(selectedPayroll.total_basic) + Number(selectedPayroll.total_allowance))}</span>
                                            </div>
                                        </div>

                                        {/* Potongan (Deductions) */}
                                        <div className="bg-gray-50 dark:bg-gray-800/80 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-red-700 dark:text-red-400 mb-3 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Potongan (Deductions)
                                                </h4>
                                                <div className="space-y-2 text-sm">
                                                    {Number(deductions.bpjs_kesehatan || 0) > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">BPJS Kesehatan (1%)</span>
                                                            <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(deductions.bpjs_kesehatan)}</span>
                                                        </div>
                                                    )}
                                                    {Number(deductions.bpjs_tk_jht || 0) > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">BPJS Ketenagakerjaan JHT (2%)</span>
                                                            <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(deductions.bpjs_tk_jht)}</span>
                                                        </div>
                                                    )}
                                                    {Number(deductions.bpjs_tk_jp || 0) > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">BPJS Ketenagakerjaan JP (1%)</span>
                                                            <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(deductions.bpjs_tk_jp)}</span>
                                                        </div>
                                                    )}
                                                    {Number(deductions.pph21 || 0) > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">Pajak PPh 21 (TER)</span>
                                                            <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(deductions.pph21)}</span>
                                                        </div>
                                                    )}
                                                    {Number(deductions.cash_advance || 0) > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">Potongan Kasbon</span>
                                                            <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(deductions.cash_advance)}</span>
                                                        </div>
                                                    )}
                                                    {Number(deductions.loan_installment || 0) > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">Cicilan Pinjaman</span>
                                                            <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(deductions.loan_installment)}</span>
                                                        </div>
                                                    )}
                                                    {Number(deductions.late_penalty || 0) > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">Denda Keterlambatan</span>
                                                            <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(deductions.late_penalty)}</span>
                                                        </div>
                                                    )}
                                                    {Number(deductions.absence_penalty || 0) > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">Potongan Alpa</span>
                                                            <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(deductions.absence_penalty)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="border-t dark:border-gray-700 pt-3 mt-4 flex justify-between font-bold text-red-600 dark:text-red-400">
                                                <span>Total Potongan</span>
                                                <span>-{formatCurrency(selectedPayroll.total_deduction)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Benefit yang ditanggung perusahaan (Optional Info) */}
                                    {benefits && Object.keys(benefits).length > 0 && (
                                        <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs">
                                            <div className="font-semibold text-blue-900 dark:text-blue-300 mb-1.5 flex justify-between">
                                                <span>🛡️ Manfaat Ditanggung Perusahaan (Company Paid Benefits)</span>
                                                <span className="font-bold">{formatCurrency(Object.values(benefits).reduce((a, b) => Number(a) + Number(b), 0))}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600 dark:text-gray-400">
                                                {Number(benefits.bpjs_kesehatan || 0) > 0 && <span>BPJS Kesehatan (4%): {formatCurrency(benefits.bpjs_kesehatan)}</span>}
                                                {Number(benefits.bpjs_tk_jht || 0) > 0 && <span>JHT (3.7%): {formatCurrency(benefits.bpjs_tk_jht)}</span>}
                                                {Number(benefits.bpjs_tk_jkk || 0) > 0 && <span>JKK (0.24%): {formatCurrency(benefits.bpjs_tk_jkk)}</span>}
                                                {Number(benefits.bpjs_tk_jkm || 0) > 0 && <span>JKM (0.3%): {formatCurrency(benefits.bpjs_tk_jkm)}</span>}
                                                {Number(benefits.bpjs_tk_jp || 0) > 0 && <span>JP (2%): {formatCurrency(benefits.bpjs_tk_jp)}</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Take Home Pay Banner */}
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800 flex justify-between items-center my-4">
                            <div>
                                <p className="text-xs font-semibold text-blue-600 dark:text-blue-300 uppercase">Gaji Bersih Diterima (Take Home Pay)</p>
                                <p className="text-2xl font-black text-blue-900 dark:text-blue-100">
                                    {formatCurrency(selectedPayroll.net_salary)}
                                </p>
                            </div>
                            <a
                                href={`/api/v1/payrolls/${selectedPayroll.id}/slip`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow transition"
                            >
                                <Download size={16} /> Unduh PDF
                            </a>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedPayroll(null)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-semibold transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
