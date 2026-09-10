import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { 
    ArrowLeftRight, Plus, CheckCircle2, XCircle, Clock, 
    Calendar, User, AlertCircle, RefreshCw, X, Check, 
    ChevronRight, ArrowRight, ShieldAlert, Sparkles
} from 'lucide-react';

export default function ShiftExchangeIndex({ auth }) {
    const [activeTab, setActiveTab] = useState('incoming'); // incoming, my_requests, approvals
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        my_requests: [],
        incoming_requests: [],
        pending_approvals: [],
        all_requests: [],
    });

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [availableShifts, setAvailableShifts] = useState({ my_shifts: [], colleague_shifts: [] });
    const [loadingShifts, setLoadingShifts] = useState(false);

    // Create form state
    const [selectedMyShiftId, setSelectedMyShiftId] = useState('');
    const [selectedColleagueId, setSelectedColleagueId] = useState('');
    const [selectedColleagueShiftId, setSelectedColleagueShiftId] = useState('');
    const [reason, setReason] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const isPrivileged = ['admin', 'hr', 'manager'].includes(auth.user.role);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/v1/shift-exchanges');
            if (res.data.success) {
                setData(res.data.data);
                // Auto switch default tab if manager/hr has pending approvals and no incoming
                if (isPrivileged && (res.data.data.incoming_requests?.length === 0) && (res.data.data.pending_approvals?.length > 0)) {
                    setActiveTab('approvals');
                } else if (res.data.data.incoming_requests?.length === 0 && res.data.data.my_requests?.length > 0) {
                    setActiveTab('my_requests');
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableShifts = async () => {
        setLoadingShifts(true);
        try {
            const res = await axios.get('/api/v1/shift-exchanges/available-shifts');
            if (res.data.success) {
                setAvailableShifts({
                    my_shifts: res.data.my_shifts,
                    colleague_shifts: res.data.colleague_shifts,
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingShifts(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openCreateModal = () => {
        setSelectedMyShiftId('');
        setSelectedColleagueId('');
        setSelectedColleagueShiftId('');
        setReason('');
        setErrorMsg('');
        setIsCreateModalOpen(true);
        fetchAvailableShifts();
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg('');

        try {
            await axios.post('/api/v1/shift-exchanges', {
                requester_shift_id: selectedMyShiftId,
                target_employee_id: selectedColleagueId,
                target_shift_id: selectedColleagueShiftId,
                reason,
            });

            setSuccessMsg('Pengajuan tukar shift berhasil dikirimkan ke rekan kerja!');
            setIsCreateModalOpen(false);
            fetchData();
            setActiveTab('my_requests');
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Gagal mengajukan tukar shift.');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePeerRespond = async (id, action) => {
        setActionLoadingId(id);
        try {
            await axios.put(`/api/v1/shift-exchanges/${id}/peer-respond`, { action });
            setSuccessMsg(action === 'accept' ? 'Tukar shift disetujui! Menunggu konfirmasi Atasan/HR.' : 'Pengajuan tukar shift ditolak.');
            fetchData();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal merespons permintaan.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleManagerApprove = async (id, action) => {
        setActionLoadingId(id);
        try {
            await axios.put(`/api/v1/shift-exchanges/${id}/manager-approve`, { action });
            setSuccessMsg(action === 'approve' ? 'Tukar shift berhasil disetujui dan jadwal otomatis diperbarui!' : 'Pengajuan tukar shift ditolak.');
            fetchData();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal memproses persetujuan.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleCancel = async (id) => {
        if (!confirm('Batalkan pengajuan tukar shift ini?')) return;
        setActionLoadingId(id);
        try {
            await axios.put(`/api/v1/shift-exchanges/${id}/cancel`);
            setSuccessMsg('Pengajuan berhasil dibatalkan.');
            fetchData();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal membatalkan.');
        } finally {
            setActionLoadingId(null);
        }
    };

    // Derived list of colleague shifts based on selected colleague
    const filteredColleagueShifts = availableShifts.colleague_shifts.filter(
        s => String(s.employee_id) === String(selectedColleagueId)
    );

    // Unique list of colleagues from colleague shifts
    const uniqueColleagues = Array.from(
        new Map(
            availableShifts.colleague_shifts.map(s => [s.employee_id, s.employee])
        ).values()
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending_peer':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock size={12} />
                        Menunggu Rekan
                    </span>
                );
            case 'pending_approval':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <Clock size={12} />
                        Menunggu Atasan / HR
                    </span>
                );
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle2 size={12} />
                        Disetujui
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        <XCircle size={12} />
                        Ditolak
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        Dibatalkan
                    </span>
                );
            default:
                return null;
        }
    };

    const renderCard = (item, type) => {
        const reqShift = item.requester_shift;
        const tgtShift = item.target_shift;
        const isLoading = actionLoadingId === item.id;

        return (
            <div
                key={item.id}
                className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
                <div>
                    {/* Top status bar */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-gray-400">#{item.id}</span>
                            {getStatusBadge(item.status)}
                        </div>
                        <span className="text-[11px] text-gray-400">
                            {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>

                    {/* Visual Comparison Box */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 my-2">
                        {/* Requester Shift */}
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pengaju</span>
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {item.requester?.user?.name || 'Karyawan'}
                            </h4>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                                {reqShift ? `${reqShift.date} (${reqShift.work_schedule?.name || 'Shift'})` : '-'}
                            </p>
                            <p className="text-[11px] text-gray-500">
                                {(reqShift?.work_schedule?.clock_in_time || reqShift?.work_schedule?.start_time)?.slice(0, 5)} - {(reqShift?.work_schedule?.clock_out_time || reqShift?.work_schedule?.end_time)?.slice(0, 5)}
                            </p>
                        </div>

                        {/* Exchange icon */}
                        <div className="flex items-center justify-center p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0 self-center">
                            <ArrowLeftRight size={16} />
                        </div>

                        {/* Target Shift */}
                        <div className="flex-1 min-w-0 sm:text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Rekan Ditukar</span>
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {item.target_employee?.user?.name || 'Rekan Kerja'}
                            </h4>
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1">
                                {tgtShift ? `${tgtShift.date} (${tgtShift.work_schedule?.name || 'Shift'})` : '-'}
                            </p>
                            <p className="text-[11px] text-gray-500">
                                {(tgtShift?.work_schedule?.clock_in_time || tgtShift?.work_schedule?.start_time)?.slice(0, 5)} - {(tgtShift?.work_schedule?.clock_out_time || tgtShift?.work_schedule?.end_time)?.slice(0, 5)}
                            </p>
                        </div>
                    </div>

                    {/* Reason */}
                    {item.reason && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700/60">
                            <span className="font-semibold text-gray-500">Alasan:</span> {item.reason}
                        </p>
                    )}

                    {item.rejection_reason && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                            <span className="font-semibold">Catatan Ditolak:</span> {item.rejection_reason}
                        </p>
                    )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    {/* Incoming requests actions (for colleague) */}
                    {type === 'incoming' && item.status === 'pending_peer' && (
                        <div className="flex items-center gap-2 w-full justify-end">
                            <button
                                onClick={() => handlePeerRespond(item.id, 'reject')}
                                disabled={isLoading}
                                className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition"
                            >
                                Tolak
                            </button>
                            <button
                                onClick={() => handlePeerRespond(item.id, 'accept')}
                                disabled={isLoading}
                                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
                            >
                                <Check size={14} />
                                Terima &amp; Teruskan ke Atasan
                            </button>
                        </div>
                    )}

                    {/* Outgoing request actions (for requester) */}
                    {type === 'my_requests' && ['pending_peer', 'pending_approval'].includes(item.status) && (
                        <button
                            onClick={() => handleCancel(item.id)}
                            disabled={isLoading}
                            className="text-xs font-semibold text-gray-500 hover:text-red-600 transition"
                        >
                            Batalkan Pengajuan
                        </button>
                    )}

                    {/* Manager/HR Approvals actions */}
                    {type === 'approvals' && item.status === 'pending_approval' && (
                        <div className="flex items-center gap-2 w-full justify-end">
                            <button
                                onClick={() => handleManagerApprove(item.id, 'reject')}
                                disabled={isLoading}
                                className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition"
                            >
                                Tolak
                            </button>
                            <button
                                onClick={() => handleManagerApprove(item.id, 'approve')}
                                disabled={isLoading}
                                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
                            >
                                <Check size={14} />
                                Setujui &amp; Tukar Roster
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ArrowLeftRight className="w-7 h-7 text-blue-600" />
                            Sistem Tukar Shift Karyawan
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Pengajuan dan persetujuan peer-to-peer pertukaran jadwal kerja antar karyawan ala Mekari Talenta.
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
                    >
                        <Plus size={18} />
                        Ajukan Tukar Shift
                    </button>
                </div>
            }
        >
            <Head title="Tukar Shift Karyawan" />

            <div className="py-6 max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
                {/* Alert Notification */}
                {successMsg && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-3 animate-in fade-in">
                        <CheckCircle2 size={20} className="shrink-0" />
                        <p className="text-sm font-medium">{successMsg}</p>
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-1">
                    <button
                        onClick={() => setActiveTab('incoming')}
                        className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition flex items-center gap-2 ${
                            activeTab === 'incoming'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                        <span>Permintaan Masuk</span>
                        {data.incoming_requests?.filter(r => r.status === 'pending_peer').length > 0 && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">
                                {data.incoming_requests.filter(r => r.status === 'pending_peer').length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('my_requests')}
                        className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition flex items-center gap-2 ${
                            activeTab === 'my_requests'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                        <span>Pengajuan Saya</span>
                        <span className="text-xs opacity-75">({data.my_requests?.length || 0})</span>
                    </button>

                    {isPrivileged && (
                        <button
                            onClick={() => setActiveTab('approvals')}
                            className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition flex items-center gap-2 ${
                                activeTab === 'approvals'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            <span>Persetujuan Atasan / HR</span>
                            {data.pending_approvals?.length > 0 && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white animate-pulse">
                                    {data.pending_approvals.length}
                                </span>
                            )}
                        </button>
                    )}
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="py-20 text-center text-gray-400">
                        <RefreshCw size={32} className="mx-auto animate-spin mb-3 text-blue-500" />
                        <p className="text-sm">Memuat data tukar shift...</p>
                    </div>
                ) : (
                    <div>
                        {activeTab === 'incoming' && (
                            data.incoming_requests?.length === 0 ? (
                                <div className="py-16 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                                    <ArrowLeftRight className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                    <h4 className="text-base font-semibold text-gray-700 dark:text-gray-200">Tidak ada permintaan tukar shift masuk</h4>
                                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                                        Saat rekan kerja mengajak Anda bertukar jadwal shift, permintaannya akan muncul di sini untuk Anda terima atau tolak.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.incoming_requests.map(item => renderCard(item, 'incoming'))}
                                </div>
                            )
                        )}

                        {activeTab === 'my_requests' && (
                            data.my_requests?.length === 0 ? (
                                <div className="py-16 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                    <h4 className="text-base font-semibold text-gray-700 dark:text-gray-200">Belum ada pengajuan tukar shift</h4>
                                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                                        Klik tombol "Ajukan Tukar Shift" untuk memilih tanggal shift Anda dan bertukar dengan rekan kerja.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.my_requests.map(item => renderCard(item, 'my_requests'))}
                                </div>
                            )
                        )}

                        {activeTab === 'approvals' && (
                            data.all_requests?.length === 0 ? (
                                <div className="py-16 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                                    <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
                                    <h4 className="text-base font-semibold text-gray-700 dark:text-gray-200">Tidak ada pengajuan yang membutuhkan persetujuan</h4>
                                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                                        Semua pengajuan tukar shift karyawan telah diproses atau belum disetujui oleh rekan kerja terkait.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.all_requests.map(item => renderCard(item, 'approvals'))}
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Modal Ajukan Tukar Shift */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                                Form Pengajuan Tukar Shift
                            </h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
                            {errorMsg && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 text-xs rounded-xl flex items-center gap-2">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            {loadingShifts ? (
                                <div className="py-8 text-center text-gray-400">
                                    <RefreshCw size={24} className="mx-auto animate-spin mb-2 text-blue-500" />
                                    <p className="text-xs">Mengambil data roster shift Anda &amp; rekan kerja...</p>
                                </div>
                            ) : (
                                <>
                                    {/* 1. Pilih Shift Saya */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            1. Pilih Shift Anda yang Ingin Ditukar *
                                        </label>
                                        <select
                                            required
                                            value={selectedMyShiftId}
                                            onChange={(e) => setSelectedMyShiftId(e.target.value)}
                                            className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        >
                                            <option value="">-- Pilih Jadwal Shift Anda --</option>
                                            {availableShifts.my_shifts.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.date} • {s.work_schedule?.name || 'Shift'} ({(s.work_schedule?.clock_in_time || s.work_schedule?.start_time)?.slice(0, 5)} - {(s.work_schedule?.clock_out_time || s.work_schedule?.end_time)?.slice(0, 5)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 2. Pilih Rekan Kerja */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            2. Pilih Rekan Kerja *
                                        </label>
                                        <select
                                            required
                                            value={selectedColleagueId}
                                            onChange={(e) => {
                                                setSelectedColleagueId(e.target.value);
                                                setSelectedColleagueShiftId('');
                                            }}
                                            className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        >
                                            <option value="">-- Pilih Rekan Kerja --</option>
                                            {uniqueColleagues.map(emp => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.user?.name || 'Karyawan'} ({emp.job_title || emp.position || 'Staff'} • {emp.department_id || '-'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 3. Pilih Shift Rekan Kerja */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            3. Pilih Shift Rekan Kerja yang Anda Inginkan *
                                        </label>
                                        <select
                                            required
                                            disabled={!selectedColleagueId}
                                            value={selectedColleagueShiftId}
                                            onChange={(e) => setSelectedColleagueShiftId(e.target.value)}
                                            className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white disabled:opacity-50"
                                        >
                                            <option value="">-- Pilih Jadwal Shift Rekan --</option>
                                            {filteredColleagueShifts.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.date} • {s.work_schedule?.name || 'Shift'} ({(s.work_schedule?.clock_in_time || s.work_schedule?.start_time)?.slice(0, 5)} - {(s.work_schedule?.clock_out_time || s.work_schedule?.end_time)?.slice(0, 5)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 4. Alasan */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            4. Alasan Pertukaran Shift
                                        </label>
                                        <textarea
                                            rows="2"
                                            placeholder="cth. Ada keperluan keluarga mendesak..."
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !selectedMyShiftId || !selectedColleagueShiftId}
                                    className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
