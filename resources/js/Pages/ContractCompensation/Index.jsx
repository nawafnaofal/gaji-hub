import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    FileText, Calculator, AlertTriangle, CheckCircle, Clock, 
    Download, DollarSign, Search, Calendar, ChevronRight, User, Plus, X, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '@/Components/Pagination';

export default function ContractCompensationIndex({ auth }) {
    const [activeTab, setActiveTab] = useState('radar'); // 'radar' or 'list'
    const [compensations, setCompensations] = useState([]);
    const [radarItems, setRadarItems] = useState([]);
    const [metrics, setMetrics] = useState({ total_paid: 0, pending_approval: 0, expiring_soon: 0 });
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [radarLoading, setRadarLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal Generate
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [modalData, setModalData] = useState({
        employee_id: '',
        override_end_date: '',
        notes: '',
    });
    const [selectedEmployeeName, setSelectedEmployeeName] = useState('');

    const isAdminOrHr = ['admin', 'hr'].includes(auth.user.role);

    useEffect(() => {
        fetchCompensations(1);
        if (isAdminOrHr) {
            fetchExpiringRadar();
        } else {
            setActiveTab('list');
        }
    }, [statusFilter, searchQuery]);

    const fetchCompensations = async (page = 1) => {
        setLoading(true);
        try {
            const res = await axios.get('/api/v1/contract-compensations', {
                params: {
                    page,
                    status: statusFilter || undefined,
                    search: searchQuery || undefined,
                }
            });
            if (res.data.success) {
                setCompensations(res.data.data || []);
                setMetrics(res.data.metrics || { total_paid: 0, pending_approval: 0, expiring_soon: 0 });
                setPagination(res.data.pagination);
            }
        } catch (err) {
            console.error(err);
            toast.error('Gagal memuat data kompensasi PKWT.');
        } finally {
            setLoading(false);
        }
    };

    const fetchExpiringRadar = async () => {
        setRadarLoading(true);
        try {
            const res = await axios.get('/api/v1/contract-compensations/expiring', { params: { days: 60 } });
            if (res.data.success) {
                setRadarItems(res.data.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setRadarLoading(false);
        }
    };

    const handleOpenGenerateModal = (item) => {
        setModalData({
            employee_id: item.employee_id,
            override_end_date: item.contract_end_date || '',
            notes: `Uang kompensasi akhir kontrak PKWT (${item.tenure_months} bulan)`,
        });
        setSelectedEmployeeName(item.employee_name);
        setShowModal(true);
    };

    const submitGenerate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await axios.post('/api/v1/contract-compensations/generate', modalData);
            if (res.data.success) {
                toast.success('Uang kompensasi PKWT berhasil dibuat!');
                setShowModal(false);
                fetchCompensations(1);
                fetchExpiringRadar();
                setActiveTab('list');
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Gagal membuat kompensasi.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (id) => {
        if (!confirm('Setujui draft kompensasi PKWT ini?')) return;
        try {
            const res = await axios.put(`/api/v1/contract-compensations/${id}/approve`);
            if (res.data.success) {
                toast.success('Kompensasi PKWT berhasil disetujui.');
                fetchCompensations(pagination?.current_page || 1);
            }
        } catch (err) {
            console.error(err);
            toast.error('Gagal menyetujui kompensasi.');
        }
    };

    const handlePay = async (id) => {
        if (!confirm('Tandai kompensasi PKWT ini telah dicairkan/dibayar ke rekening karyawan?')) return;
        try {
            const res = await axios.put(`/api/v1/contract-compensations/${id}/pay`);
            if (res.data.success) {
                toast.success('Kompensasi PKWT berhasil dicairkan.');
                fetchCompensations(pagination?.current_page || 1);
                fetchExpiringRadar();
            }
        } catch (err) {
            console.error(err);
            toast.error('Gagal mencairkan kompensasi.');
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div>
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        Uang Kompensasi PKWT (PP No. 35 Tahun 2021)
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Kewajiban pembayaran uang kompensasi berakhirnya kontrak kerja PKWT: Formula (Masa Kerja / 12) x 1 Bulan Upah, approval berjenjang, dan slip PDF resmi.
                    </p>
                </div>
            }
        >
            <Head title="Kompensasi PKWT" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Metric Cards (Admin/HR) */}
                    {isAdminOrHr && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                                        Total Kompensasi Dicairkan
                                    </span>
                                    <span className="text-xl font-black text-gray-900 dark:text-white">
                                        Rp {new Intl.NumberFormat('id-ID').format(metrics.total_paid || 0)}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-xl">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                                        Draft Menunggu Approval
                                    </span>
                                    <span className="text-xl font-black text-gray-900 dark:text-white">
                                        {metrics.pending_approval || 0} Pengajuan
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                                        Kontrak Segera Habis (60 Hari)
                                    </span>
                                    <span className="text-xl font-black text-gray-900 dark:text-white">
                                        {metrics.expiring_soon || 0} Karyawan
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Tabs (Admin/HR only) */}
                    {isAdminOrHr && (
                        <div className="flex border-b border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setActiveTab('radar')}
                                className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                                    activeTab === 'radar'
                                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                            >
                                <AlertTriangle size={16} />
                                Radar Kontrak Jatuh Tempo ({radarItems.length})
                            </button>

                            <button
                                onClick={() => setActiveTab('list')}
                                className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                                    activeTab === 'list'
                                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                            >
                                <FileText size={16} />
                                Riwayat Uang Kompensasi PKWT
                            </button>
                        </div>
                    )}

                    {/* TAB 1: RADAR KONTRAK JATUH TEMPO */}
                    {isAdminOrHr && activeTab === 'radar' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-4 gap-2">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                                        Radar Pemantauan Kontrak PKWT (60 Hari ke Depan)
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Sistem secara otomatis menghitung masa kerja dan estimasi nominal uang kompensasi sesuai amanat Pasal 15 PP 35/2021.
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                            <th className="p-4">Karyawan PKWT</th>
                                            <th className="p-4">Periode Kontrak</th>
                                            <th className="p-4">Masa Kerja</th>
                                            <th className="p-4">Jatuh Tempo</th>
                                            <th className="p-4">Upah Bulanan</th>
                                            <th className="p-4">Estimasi Kompensasi</th>
                                            <th className="p-4 text-center">Tindakan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                        {radarLoading ? (
                                            <tr><td colSpan="7" className="p-8 text-center text-gray-400">Memindai radar kontrak...</td></tr>
                                        ) : radarItems.length === 0 ? (
                                            <tr><td colSpan="7" className="p-8 text-center text-gray-400">Tidak ada kontrak PKWT yang akan berakhir dalam 60 hari ke depan.</td></tr>
                                        ) : (
                                            radarItems.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                                    <td className="p-4">
                                                        <div className="font-semibold text-gray-900 dark:text-white">{item.employee_name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.employee_code} • {item.department || '-'}</div>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                                                        <div>{item.contract_start_date} s/d</div>
                                                        <div className="font-semibold">{item.contract_end_date}</div>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap">
                                                        <span className="font-bold text-gray-800 dark:text-gray-200">{item.tenure_months} Bulan</span>
                                                        <span className="text-[10px] text-gray-400 block">({(item.tenure_months / 12).toFixed(2)} thn)</span>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap">
                                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full inline-block ${
                                                            item.days_left <= 14 
                                                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 animate-pulse' 
                                                                : item.days_left <= 30
                                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                                        }`}>
                                                            {item.days_left <= 0 ? 'Hari Ini / Lewat' : `${item.days_left} Hari Lagi`}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                                                        Rp {new Intl.NumberFormat('id-ID').format(item.monthly_wage)}
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap">
                                                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                                                            Rp {new Intl.NumberFormat('id-ID').format(item.compensation_amount)}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 block">
                                                            ({item.tenure_months}/12) x Upah
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center whitespace-nowrap">
                                                        {item.existing_status ? (
                                                            <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-full font-semibold text-gray-600 dark:text-gray-300">
                                                                Sudah Dibuat ({item.existing_status.toUpperCase()})
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleOpenGenerateModal(item)}
                                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5 mx-auto"
                                                            >
                                                                <Plus size={14} /> Hitung & Simpan
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: DAFTAR UANG KOMPENSASI PKWT */}
                    {activeTab === 'list' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-4 gap-3">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        Daftar Uang Kompensasi PKWT
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Daftar persetujuan dan pencairan uang kompensasi akhir kontrak karyawan.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <select
                                        value={statusFilter}
                                        onChange={e => setStatusFilter(e.target.value)}
                                        className="text-xs rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                                    >
                                        <option value="">Semua Status</option>
                                        <option value="draft">Draft</option>
                                        <option value="approved">Disetujui (Approved)</option>
                                        <option value="paid">Dicairkan (Paid)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                            <th className="p-4">Karyawan</th>
                                            <th className="p-4">Masa Kontrak</th>
                                            <th className="p-4">Masa Kerja Efektif</th>
                                            <th className="p-4">Upah Pokok</th>
                                            <th className="p-4">Uang Kompensasi</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-center">Aksi / Unduh</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                        {loading ? (
                                            <tr><td colSpan="7" className="p-8 text-center text-gray-400">Memuat data kompensasi...</td></tr>
                                        ) : compensations.length === 0 ? (
                                            <tr><td colSpan="7" className="p-8 text-center text-gray-400">Belum ada kompensasi PKWT yang tercatat.</td></tr>
                                        ) : (
                                            compensations.map((c) => (
                                                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                                    <td className="p-4">
                                                        <div className="font-semibold text-gray-900 dark:text-white">{c.employee?.user?.name || '-'}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{c.employee?.employee_code || '-'} • {c.employee?.department || '-'}</div>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                                                        <div>{c.contract_start_date}</div>
                                                        <div className="font-semibold">s/d {c.contract_end_date}</div>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap">
                                                        <span className="font-bold text-gray-800 dark:text-gray-200">{c.tenure_months} Bulan</span>
                                                        <span className="text-[10px] text-gray-400 block">({(c.tenure_months / 12).toFixed(3)} rasio)</span>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                                                        Rp {new Intl.NumberFormat('id-ID').format(c.monthly_wage)}
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap font-black text-emerald-600 dark:text-emerald-400">
                                                        Rp {new Intl.NumberFormat('id-ID').format(c.compensation_amount)}
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap">
                                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-block ${
                                                            c.status === 'paid'
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                                                : c.status === 'approved'
                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                                        }`}>
                                                            {c.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center whitespace-nowrap">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {/* Download Slip PDF */}
                                                            <a
                                                                href={`/api/v1/contract-compensations/${c.id}/slip-pdf`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-xs font-semibold transition flex items-center gap-1"
                                                                title="Unduh Slip PDF"
                                                            >
                                                                <Download size={13} /> Slip PDF
                                                            </a>

                                                            {/* HR Actions */}
                                                            {isAdminOrHr && c.status === 'draft' && (
                                                                <button
                                                                    onClick={() => handleApprove(c.id)}
                                                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                                                                    title="Setujui Kompensasi"
                                                                >
                                                                    <CheckCircle size={13} /> Setujui
                                                                </button>
                                                            )}

                                                            {isAdminOrHr && c.status === 'approved' && (
                                                                <button
                                                                    onClick={() => handlePay(c.id)}
                                                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                                                                    title="Cairkan Uang Kompensasi"
                                                                >
                                                                    <DollarSign size={13} /> Cairkan
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination meta={pagination} onPageChange={fetchCompensations} />
                        </div>
                    )}

                </div>
            </div>

            {/* MODAL GENERATE KOMPENSASI PKWT */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 mb-4">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-blue-600" />
                                Hitung Kompensasi PKWT
                            </h4>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={submitGenerate} className="space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                    Karyawan PKWT
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={selectedEmployeeName}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                    Tanggal Akhir Kontrak (Selesai Bekerja)
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={modalData.override_end_date}
                                    onChange={e => setModalData({...modalData, override_end_date: e.target.value})}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 text-sm"
                                />
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
                                    Dapat disesuaikan jika kontrak berakhir lebih awal.
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                    Catatan / Keterangan
                                </label>
                                <textarea
                                    rows="2"
                                    value={modalData.notes}
                                    onChange={e => setModalData({...modalData, notes: e.target.value})}
                                    placeholder="Keterangan tambahan atau nomor surat perjanjian..."
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 text-sm"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow flex items-center gap-1.5"
                                >
                                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                    Simpan Draft Kompensasi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
