import React, { useState } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { BarChart3, Calendar, Users, Clock, Star, Download, FileText, TrendingUp } from 'lucide-react';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

export default function ReportIndex({ auth }) {
    const [activeTab, setActiveTab] = useState('attendance');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [filters, setFilters] = useState({
        month: currentMonth,
        year: currentYear,
    });

    const reportTypes = [
        { key: 'attendance', label: 'Rekap Absensi', icon: Calendar, color: 'blue' },
        { key: 'payroll', label: 'Laporan Gaji', icon: BarChart3, color: 'green' },
        { key: 'leave', label: 'Saldo Cuti', icon: Users, color: 'purple' },
        { key: 'overtime', label: 'Rekap Lembur', icon: Clock, color: 'orange' },
        { key: 'kpi', label: 'Penilaian Kinerja', icon: Star, color: 'yellow' },
    ];

    const fetchReport = async () => {
        setLoading(true);
        setReportData(null);
        try {
            const params = activeTab === 'leave'
                ? { year: filters.year }
                : { month: filters.month, year: filters.year };

            const res = await axios.get(`/api/v1/reports/${activeTab}`, { params });
            setReportData(res.data);
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal memuat laporan.');
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        if (!reportData?.data) return;
        const data = reportData.data;
        if (!data.length) return;

        const keys = Object.keys(data[0]);
        const csv = [
            keys.join(','),
            ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `laporan_${activeTab}_${filters.month ?? ''}_${filters.year}.csv`;
        link.click();
    };

    const formatCurrency = (num) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num || 0);

    const renderTable = () => {
        if (!reportData?.data) return null;
        const data = reportData.data;
        if (!data.length) return <p className="text-center text-gray-500 py-8">Tidak ada data untuk periode ini.</p>;

        if (activeTab === 'attendance') {
            return (
                <table className="w-full text-sm">
                    <thead><tr className="bg-gray-100 dark:bg-gray-700">
                        {['Kode', 'Nama', 'Jabatan', 'Dept', 'Hadir', 'Terlambat', 'Absen', 'Total Hari'].map(h => (
                            <th key={h} className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300">{h}</th>
                        ))}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {data.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{row.employee_code}</td>
                                <td className="p-3 font-medium dark:text-white">{row.name}</td>
                                <td className="p-3 text-gray-600 dark:text-gray-400">{row.position || '-'}</td>
                                <td className="p-3 text-gray-600 dark:text-gray-400">{row.department || '-'}</td>
                                <td className="p-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">{row.present}</span></td>
                                <td className="p-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">{row.late}</span></td>
                                <td className="p-3"><span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">{row.absent}</span></td>
                                <td className="p-3 text-gray-600 dark:text-gray-400">{row.total_days}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (activeTab === 'payroll') {
            const summary = reportData.summary;
            return (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total Karyawan', value: summary.total_employees, color: 'blue' },
                            { label: 'Total Gaji Pokok', value: formatCurrency(summary.total_basic_salary), color: 'green' },
                            { label: 'Total Potongan', value: formatCurrency(summary.total_deductions), color: 'red' },
                            { label: 'Total Gaji Bersih', value: formatCurrency(summary.total_net_salary), color: 'purple' },
                        ].map(stat => (
                            <div key={stat.label} className={`p-4 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 border border-${stat.color}-100 dark:border-${stat.color}-800`}>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                                <p className={`text-lg font-bold text-${stat.color}-700 dark:text-${stat.color}-400 mt-1`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                    <table className="w-full text-sm">
                        <thead><tr className="bg-gray-100 dark:bg-gray-700">
                            {['Nama Karyawan', 'Gaji Pokok', 'Tunjangan', 'Potongan', 'BPJS', 'PPh21', 'Gaji Bersih'].map(h => (
                                <th key={h} className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300">{h}</th>
                            ))}
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {data.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3 font-medium dark:text-white">{row.employee?.user?.name}</td>
                                    <td className="p-3 text-gray-700 dark:text-gray-300">{formatCurrency(row.basic_salary)}</td>
                                    <td className="p-3 text-green-600">{formatCurrency(row.total_allowances)}</td>
                                    <td className="p-3 text-red-500">-{formatCurrency(row.total_deductions)}</td>
                                    <td className="p-3 text-red-400">-{formatCurrency((row.bpjs_kesehatan_employee || 0) + (row.bpjs_ketenagakerjaan_employee || 0))}</td>
                                    <td className="p-3 text-red-400">-{formatCurrency(row.pph21)}</td>
                                    <td className="p-3 font-bold text-blue-700 dark:text-blue-400">{formatCurrency(row.net_salary)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            );
        }

        if (activeTab === 'leave') {
            return (
                <table className="w-full text-sm">
                    <thead><tr className="bg-gray-100 dark:bg-gray-700">
                        {['Kode', 'Nama', 'Departemen', 'Kuota', 'Terpakai', 'Sisa'].map(h => (
                            <th key={h} className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300">{h}</th>
                        ))}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {data.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-3 text-xs font-mono text-gray-500">{row.employee_code}</td>
                                <td className="p-3 font-medium dark:text-white">{row.name}</td>
                                <td className="p-3 text-gray-600 dark:text-gray-400">{row.department || '-'}</td>
                                <td className="p-3 text-blue-700 dark:text-blue-400 font-semibold">{row.quota} hari</td>
                                <td className="p-3 text-orange-600">{row.used} hari</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.remaining > 5 ? 'bg-green-100 text-green-700' : row.remaining > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {row.remaining} hari
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (activeTab === 'overtime') {
            return (
                <table className="w-full text-sm">
                    <thead><tr className="bg-gray-100 dark:bg-gray-700">
                        {['Tanggal', 'Nama Karyawan', 'Jam', 'Keterangan'].map(h => (
                            <th key={h} className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300">{h}</th>
                        ))}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {data.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-3 text-gray-600 dark:text-gray-400">{row.date}</td>
                                <td className="p-3 font-medium dark:text-white">{row.employee?.user?.name}</td>
                                <td className="p-3"><span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">{row.hours} jam</span></td>
                                <td className="p-3 text-gray-600 dark:text-gray-400">{row.reason || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot><tr className="bg-orange-50 dark:bg-orange-900/20">
                        <td colSpan={2} className="p-3 font-bold text-gray-700 dark:text-gray-300">Total Jam Lembur:</td>
                        <td colSpan={2} className="p-3 font-bold text-orange-700 dark:text-orange-400">{reportData.total_hours} jam</td>
                    </tr></tfoot>
                </table>
            );
        }

        if (activeTab === 'kpi') {
            const summary = reportData.summary;
            return (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total Dinilai', value: summary.total_reviewed + ' karyawan', color: 'blue' },
                            { label: 'Rata-rata Skor', value: summary.average_score, color: 'green' },
                            { label: 'Skor Tertinggi', value: summary.highest_score, color: 'yellow' },
                            { label: 'Skor Terendah', value: summary.lowest_score, color: 'red' },
                        ].map(stat => (
                            <div key={stat.label} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border dark:border-gray-600">
                                <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                    <table className="w-full text-sm">
                        <thead><tr className="bg-gray-100 dark:bg-gray-700">
                            {['Peringkat', 'Nama Karyawan', 'Skor KPI', 'Penilai', 'Catatan'].map(h => (
                                <th key={h} className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300">{h}</th>
                            ))}
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {data.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3 text-center">
                                        <span className={`w-7 h-7 inline-flex items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-orange-300 text-orange-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{i + 1}</span>
                                    </td>
                                    <td className="p-3 font-medium dark:text-white">{row.employee?.user?.name}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.score >= 80 ? 'bg-green-100 text-green-700' : row.score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{row.score}/100</span>
                                    </td>
                                    <td className="p-3 text-gray-600 dark:text-gray-400">{row.reviewer?.name || 'Sistem'}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">{row.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            );
        }

        return null;
    };

    const showMonthFilter = activeTab !== 'leave';

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Pusat Laporan (Report Center)</h2>}
        >
            <Head title="Laporan HR" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Tab Navigation */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-2 flex flex-wrap gap-2 border border-gray-100 dark:border-gray-700">
                        {reportTypes.map(tab => (
                            <button key={tab.key}
                                onClick={() => { setActiveTab(tab.key); setReportData(null); }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}>
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Filter & Generate */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex flex-wrap gap-4 items-end">
                            {showMonthFilter && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bulan</label>
                                    <select className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })}>
                                        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tahun</label>
                                <input type="number" className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white w-28"
                                    value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })} />
                            </div>
                            <button onClick={fetchReport} disabled={loading}
                                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                <TrendingUp size={16} />
                                {loading ? 'Memuat...' : 'Generate Laporan'}
                            </button>
                            {reportData && (
                                <button onClick={exportCSV}
                                    className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700">
                                    <Download size={16} /> Export CSV
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Report Table */}
                    {reportData && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                                    <FileText size={20} />
                                    Laporan {reportTypes.find(t => t.key === activeTab)?.label}
                                    <span className="text-sm font-normal text-gray-500 ml-2">
                                        {showMonthFilter ? `${MONTHS[filters.month - 1]} ` : ''}{filters.year}
                                    </span>
                                </h3>
                            </div>
                            <div className="overflow-x-auto">{renderTable()}</div>
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
