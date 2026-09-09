import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { 
    Gift, Calculator, Download, CheckCircle, Clock, AlertCircle, 
    DollarSign, Users, ChevronRight, FileText, Check, ArrowRight
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

const RELIGIOUS_HOLIDAYS = [
    { key: 'idul_fitri', label: 'Hari Raya Idul Fitri (Muslim)' },
    { key: 'natal', label: 'Hari Raya Natal (Kristen/Katolik)' },
    { key: 'nyepi', label: 'Hari Raya Nyepi (Hindu)' },
    { key: 'waisak', label: 'Hari Raya Waisak (Buddha)' },
    { key: 'imlek', label: 'Tahun Baru Imlek (Konghucu)' }
];

export default function ThrIndex({ auth }) {
    const [year, setYear] = useState(new Date().getFullYear());
    const [holiday, setHoliday] = useState('idul_fitri');
    const [activeTab, setActiveTab] = useState('records'); // 'records' | 'preview'
    const [loading, setLoading] = useState(true);
    
    // Data state
    const [records, setRecords] = useState([]);
    const [summary, setSummary] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [previewLoading, setPreviewLoading] = useState(false);

    const isAdminOrHr = ['admin', 'hr'].includes(auth.user.role);

    useEffect(() => {
        fetchRecords();
    }, [year, holiday]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/v1/thrs', { params: { year, religious_holiday: holiday } });
            const raw = res.data.data;
            setRecords(Array.isArray(raw) ? raw : (raw?.data || []));
            setSummary(res.data.summary);
        } catch (error) {
            console.error(error);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPreview = async () => {
        setPreviewLoading(true);
        try {
            const res = await axios.get('/api/v1/thrs/preview', { params: { year, religious_holiday: holiday } });
            const raw = res.data.data;
            setPreviewData(Array.isArray(raw) ? raw : (raw?.data || []));
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat pratinjau kalkulasi THR');
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!confirm(`Generate dan simpan draft THR ${holiday.replace('_', ' ')} tahun ${year} untuk seluruh karyawan?`)) return;
        
        toast.loading('Menghitung dan menerbitkan THR...', { id: 'thr_action' });
        try {
            const res = await axios.post('/api/v1/thrs/generate', { year, religious_holiday: holiday });
            toast.success(res.data.message || 'THR berhasil diterbitkan sebagai draft!', { id: 'thr_action' });
            setActiveTab('records');
            fetchRecords();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Gagal generate THR', { id: 'thr_action' });
        }
    };

    const handleBulkApprove = async () => {
        if (!confirm('Setujui seluruh draft THR untuk periode ini?')) return;
        toast.loading('Menyetujui THR...', { id: 'thr_action' });
        try {
            await axios.post('/api/v1/thrs/bulk-approve', { year, religious_holiday: holiday });
            toast.success('Seluruh draft THR berhasil disetujui!', { id: 'thr_action' });
            fetchRecords();
        } catch (error) {
            toast.error('Gagal menyetujui THR', { id: 'thr_action' });
        }
    };

    const handleBulkDisburse = async () => {
        if (!confirm('Cairkan (tandai LUNAS/PAID) seluruh THR yang telah disetujui?')) return;
        toast.loading('Mencairkan THR...', { id: 'thr_action' });
        try {
            await axios.post('/api/v1/thrs/bulk-disburse', { year, religious_holiday: holiday });
            toast.success('Seluruh THR berhasil dicairkan!', { id: 'thr_action' });
            fetchRecords();
        } catch (error) {
            toast.error('Gagal mencairkan THR', { id: 'thr_action' });
        }
    };

    const handleSingleApprove = async (id) => {
        try {
            await axios.put(`/api/v1/thrs/${id}/approve`);
            toast.success('THR disetujui');
            fetchRecords();
        } catch (error) {
            toast.error('Gagal menyetujui');
        }
    };

    const handleSingleDisburse = async (id) => {
        try {
            await axios.put(`/api/v1/thrs/${id}/disburse`);
            toast.success('THR dicairkan');
            fetchRecords();
        } catch (error) {
            toast.error('Gagal mencairkan');
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Tunjangan Hari Raya (THR)</h2>}
        >
            <Head title="Kalkulator & Manajemen THR" />

            <div className="py-8 bg-gray-50/50 dark:bg-gray-900/50 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 sm:p-8 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md mb-2">
                                <Gift size={13} /> Regulasi Ketenagakerjaan Permenaker No. 6/2016
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Kalkulator & Pembagian THR</h1>
                            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                                Perhitungan otomatis THR Keagamaan (Masa kerja &ge; 12 bulan dapat 1x gaji, 1-11 bulan prorata).
                            </p>
                        </div>

                        {/* Year & Holiday Filter */}
                        <div className="flex flex-wrap gap-2">
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="text-xs font-bold rounded-xl bg-white/10 border-white/20 text-white dark:bg-gray-800 py-2"
                            >
                                {[2024, 2025, 2026, 2027].map(y => (
                                    <option key={y} value={y} className="text-gray-900">{y}</option>
                                ))}
                            </select>

                            <select
                                value={holiday}
                                onChange={(e) => setHoliday(e.target.value)}
                                className="text-xs font-bold rounded-xl bg-white/10 border-white/20 text-white dark:bg-gray-800 py-2"
                            >
                                {RELIGIOUS_HOLIDAYS.map(h => (
                                    <option key={h.key} value={h.key} className="text-gray-900">{h.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    {summary && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Karyawan Terdaftar</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{summary.total_employees}</p>
                                </div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-2xl">
                                    <Users size={22} />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Total Payout THR</p>
                                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(summary.total_payout)}</p>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl">
                                    <DollarSign size={22} />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Draft / Menunggu Approval</p>
                                    <p className="text-2xl font-black text-amber-500 mt-1">{summary.draft_count}</p>
                                </div>
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-2xl">
                                    <Clock size={22} />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Tercairkan (Paid)</p>
                                    <p className="text-2xl font-black text-teal-600 mt-1">{summary.paid_count}</p>
                                </div>
                                <div className="p-3 bg-teal-50 dark:bg-teal-950/40 text-teal-600 rounded-2xl">
                                    <CheckCircle size={22} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Tabs (Only for HR/Admin) */}
                    {isAdminOrHr && (
                        <div className="flex border-b border-gray-200 dark:border-gray-700 gap-4">
                            <button
                                onClick={() => setActiveTab('records')}
                                className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                                    activeTab === 'records'
                                        ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Daftar THR Terbit ({records.length})
                            </button>
                            <button
                                onClick={() => { setActiveTab('preview'); fetchPreview(); }}
                                className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                                    activeTab === 'preview'
                                        ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Calculator size={14} /> Simulasi & Generator Permenaker 6/2016
                            </button>
                        </div>
                    )}

                    {/* TAB 1: DAFTAR RECORD THR TERBIT */}
                    {activeTab === 'records' && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Toolbar */}
                            {isAdminOrHr && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-750/50 border-b border-gray-100 dark:border-gray-700 flex flex-wrap justify-between items-center gap-3">
                                    <div className="text-xs text-gray-500">
                                        Menampilkan THR periode <strong className="uppercase">{holiday.replace('_', ' ')} {year}</strong>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {summary?.draft_count > 0 && (
                                            <button
                                                onClick={handleBulkApprove}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                                            >
                                                <Check size={13} /> Setujui Semua ({summary.draft_count})
                                            </button>
                                        )}
                                        {summary?.approved_count > 0 && (
                                            <button
                                                onClick={handleBulkDisburse}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                                            >
                                                <CheckCircle size={13} /> Cairkan Semua ({summary.approved_count})
                                            </button>
                                        )}
                                        <a
                                            href={`/api/v1/thrs/export/bank?year=${year}&religious_holiday=${holiday}`}
                                            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                                        >
                                            <Download size={13} /> Ekspor CSV Bank (BCA/Mandiri)
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-gray-500 dark:text-gray-400">
                                    <thead className="text-[11px] text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                                        <tr>
                                            <th className="px-6 py-3.5">Karyawan</th>
                                            <th className="px-6 py-3.5">Masa Kerja</th>
                                            <th className="px-6 py-3.5">Gaji Pokok</th>
                                            <th className="px-6 py-3.5">Nominal THR</th>
                                            <th className="px-6 py-3.5">Status</th>
                                            <th className="px-6 py-3.5 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-8 text-center text-gray-400">Memuat data THR...</td>
                                            </tr>
                                        ) : !Array.isArray(records) || records.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                                    <Gift size={36} className="mx-auto mb-2 opacity-50 text-emerald-500" />
                                                    <p className="font-semibold text-gray-700 dark:text-gray-300">Belum ada THR diterbitkan untuk periode ini.</p>
                                                    {isAdminOrHr && (
                                                        <button
                                                            onClick={() => { setActiveTab('preview'); fetchPreview(); }}
                                                            className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 inline-flex items-center gap-1.5"
                                                        >
                                                            <Calculator size={14} /> Hitung & Terbitkan Sekarang
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ) : (
                                            records.map(r => (
                                                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-750/50 transition">
                                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                                        {r.employee?.user?.name || 'Karyawan'}
                                                        <div className="text-[10px] text-gray-400 font-normal">
                                                            {r.employee?.employee_code} • {r.employee?.department_id}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{r.service_months} Bulan</span>
                                                        <div className="text-[10px] text-gray-400">
                                                            {r.service_months >= 12 ? '1x Upah Penuh' : `Prorata (${r.service_months}/12)`}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">{formatCurrency(r.basic_salary)}</td>
                                                    <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(r.thr_amount)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                            r.status === 'paid' 
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                                                : r.status === 'approved' 
                                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' 
                                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                                        }`}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center space-x-2">
                                                        {isAdminOrHr && r.status === 'draft' && (
                                                            <button
                                                                onClick={() => handleSingleApprove(r.id)}
                                                                className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold hover:bg-blue-100"
                                                            >
                                                                Approve
                                                            </button>
                                                        )}
                                                        {isAdminOrHr && r.status === 'approved' && (
                                                            <button
                                                                onClick={() => handleSingleDisburse(r.id)}
                                                                className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-bold hover:bg-emerald-100"
                                                            >
                                                                Cairkan
                                                            </button>
                                                        )}
                                                        <a
                                                            href={`/api/v1/thrs/${r.id}/slip-pdf`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-semibold hover:bg-gray-200"
                                                            title="Unduh Slip THR Resmi"
                                                        >
                                                            <FileText size={12} /> Slip PDF
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: SIMULASI & GENERATOR PERMENAKER 6/2016 */}
                    {activeTab === 'preview' && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-5 bg-gray-50 dark:bg-gray-750/50 border-b border-gray-100 dark:border-gray-700 flex flex-wrap justify-between items-center gap-3">
                                <div>
                                    <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                        <Calculator size={16} className="text-emerald-600" /> Pratinjau Perhitungan Otomatis Seluruh Karyawan
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Sistem mengkalkulasi berdasarkan tanggal masuk karyawan hingga hari raya.
                                    </p>
                                </div>
                                <button
                                    onClick={handleGenerate}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                                >
                                    <CheckCircle size={15} /> Simpan & Terbitkan Draft THR ({previewData.length} Karyawan)
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-gray-500 dark:text-gray-400">
                                    <thead className="text-[11px] text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                                        <tr>
                                            <th className="px-6 py-3.5">Karyawan</th>
                                            <th className="px-6 py-3.5">Tgl Bergabung</th>
                                            <th className="px-6 py-3.5">Masa Kerja</th>
                                            <th className="px-6 py-3.5">Gaji Pokok</th>
                                            <th className="px-6 py-3.5">Aturan Permenaker 6/2016</th>
                                            <th className="px-6 py-3.5 text-right">Estimasi THR</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {previewLoading ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-8 text-center text-gray-400">Menghitung simulasi THR...</td>
                                            </tr>
                                        ) : !Array.isArray(previewData) || previewData.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-8 text-center text-gray-400">Tidak ada data karyawan aktif.</td>
                                            </tr>
                                        ) : (
                                            previewData.map((p, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-750/50 transition">
                                                    <td className="px-6 py-3 font-bold text-gray-900 dark:text-white">
                                                        {p.name}
                                                        <div className="text-[10px] text-gray-400 font-normal">{p.employee_code} • {p.department}</div>
                                                    </td>
                                                    <td className="px-6 py-3">{p.join_date || '-'}</td>
                                                    <td className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300">{p.service_months} Bulan</td>
                                                    <td className="px-6 py-3">{formatCurrency(p.basic_salary)}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                            p.service_months >= 12 
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                                                : p.service_months >= 1 
                                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' 
                                                                    : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {p.rule_applied}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(p.thr_amount)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <Toaster position="top-right" />
        </AuthenticatedLayout>
    );
}
