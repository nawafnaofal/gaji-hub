import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    Clock, CheckCircle, XCircle, Loader2, Calculator, 
    Calendar, AlertCircle, TrendingUp, Info, HelpCircle, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '@/Components/Pagination';

export default function OvertimeIndex({ auth }) {
    const [overtimes, setOvertimes] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [calcResult, setCalcResult] = useState(null);
    const [selectedBreakdown, setSelectedBreakdown] = useState(null);

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        start_time: '17:00',
        end_time: '20:00',
        day_type: '', // empty = auto-detect
        reason: ''
    });

    const isEmployee = auth.user.role === 'employee';

    useEffect(() => {
        fetchOvertimes(1);
    }, []);

    // Live calculation whenever date, start_time, end_time, or day_type changes
    useEffect(() => {
        if (!form.date || !form.start_time || !form.end_time) {
            setCalcResult(null);
            return;
        }

        const timer = setTimeout(() => {
            simulateCalculation();
        }, 300);

        return () => clearTimeout(timer);
    }, [form.date, form.start_time, form.end_time, form.day_type]);

    const simulateCalculation = async () => {
        setCalculating(true);
        try {
            const res = await axios.post('/api/v1/overtimes/calculate', {
                date: form.date,
                start_time: form.start_time,
                end_time: form.end_time,
                day_type: form.day_type || null,
            });
            if (res.data.success) {
                setCalcResult(res.data.data);
            }
        } catch (error) {
            console.error('Calculation preview failed', error);
        } finally {
            setCalculating(false);
        }
    };

    const fetchOvertimes = async (page = 1) => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/overtimes', { params: { page } });
            const raw = response.data.data;
            const items = Array.isArray(raw) ? raw : (raw?.data || []);
            setOvertimes(items);
            setPagination(response.data.pagination || (Array.isArray(raw) ? null : raw));
        } catch (error) {
            console.error("Error fetching overtimes", error);
            setOvertimes([]);
        } finally {
            setLoading(false);
        }
    };

    const submitOvertime = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post('/api/v1/overtimes', {
                date: form.date,
                start_time: form.start_time,
                end_time: form.end_time,
                day_type: form.day_type || null,
                reason: form.reason
            });
            toast.success('Pengajuan lembur berhasil dikirim dengan rincian PP 35/2021!');
            setForm({ 
                date: new Date().toISOString().split('T')[0], 
                start_time: '17:00', 
                end_time: '20:00', 
                day_type: '', 
                reason: '' 
            });
            fetchOvertimes();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Gagal mengajukan lembur.');
        } finally {
            setSubmitting(false);
        }
    };

    const updateStatus = async (id, status) => {
        if (!confirm(`Anda yakin ingin memproses status lembur ini?`)) return;
        try {
            await axios.put(`/api/v1/overtimes/${id}`, { status });
            toast.success('Status lembur berhasil diperbarui.');
            fetchOvertimes();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Gagal mengupdate status.');
        }
    };

    const canApprove = (ot) => {
        if (isEmployee) return false;
        return ot.status === 'pending_hr' || ot.status === 'pending' || ot.status === 'pending_manager';
    };

    const showActionColumn = !isEmployee;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight flex items-center gap-2">
                            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            Manajemen Lembur (Overtime Depnaker PP 35/2021)
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Perhitungan otomatis berstandar resmi Depnaker & Talenta: Tarif 1/173 x Gaji, Multiplier 1.5x & 2x (Hari Kerja) atau 2x, 3x, 4x (Hari Libur/Weekend).
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Manajemen Lembur" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Form Pengajuan Lembur (Khusus Karyawan atau HR jika ingin input) */}
                    {isEmployee && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Calculator className="w-5 h-5 text-blue-600" />
                                        Form Pengajuan Lembur & Simulator Upah
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Isi waktu pelaksanaan lembur. Sistem akan secara otomatis menghitung jam pengali dan estimasi nominal upah lembur Anda.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={submitOvertime} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                            Tanggal Pelaksanaan
                                        </label>
                                        <input 
                                            type="date" 
                                            required 
                                            className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                                            value={form.date} 
                                            onChange={e => setForm({...form, date: e.target.value})} 
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                            Jam Mulai
                                        </label>
                                        <input 
                                            type="time" 
                                            required 
                                            className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                                            value={form.start_time} 
                                            onChange={e => setForm({...form, start_time: e.target.value})} 
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                            Jam Selesai
                                        </label>
                                        <input 
                                            type="time" 
                                            required 
                                            className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                                            value={form.end_time} 
                                            onChange={e => setForm({...form, end_time: e.target.value})} 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                            Tipe Hari Kerja
                                        </label>
                                        <select 
                                            className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            value={form.day_type}
                                            onChange={e => setForm({...form, day_type: e.target.value})}
                                        >
                                            <option value="">Otomatis Deteksi (Sistem & Kalender Libur)</option>
                                            <option value="workday">Hari Kerja Biasa (1.5x, 2.0x)</option>
                                            <option value="holiday">Hari Libur Resmi / Akhir Pekan (2.0x, 3.0x, 4.0x)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                            Keterangan / Alasan Lembur
                                        </label>
                                        <input 
                                            type="text"
                                            required 
                                            placeholder="Contoh: Deployment sistem & verifikasi audit bulanan"
                                            className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                                            value={form.reason} 
                                            onChange={e => setForm({...form, reason: e.target.value})} 
                                        />
                                    </div>
                                </div>

                                {/* Simulator Preview Card */}
                                {calcResult && (
                                    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-700/50 dark:via-gray-700/30 dark:to-gray-700/50 rounded-xl p-5 border border-blue-100 dark:border-gray-600">
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-blue-200/60 dark:border-gray-600">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
                                                    <TrendingUp size={20} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                                                            Simulasi Lembur Depnaker PP 35/2021
                                                        </span>
                                                        <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                                                            calcResult.day_type === 'holiday' 
                                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300' 
                                                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                                                        }`}>
                                                            {calcResult.day_type === 'holiday' ? 'HARI LIBUR / WEEKEND' : 'HARI KERJA BIASA'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        Upah Sejam: <strong>Rp {new Intl.NumberFormat('id-ID').format(calcResult.hourly_rate)}</strong> (1/173 x Gaji Pokok)
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-left md:text-right">
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Estimasi Uang Lembur:</div>
                                                <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                                                    Rp {new Intl.NumberFormat('id-ID').format(calcResult.total_pay)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Metrics Row */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                                            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 border border-blue-100/50 dark:border-gray-600">
                                                <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Durasi Aktual</span>
                                                <span className="text-base font-bold text-gray-800 dark:text-gray-200">
                                                    {calcResult.duration_hours} Jam
                                                </span>
                                            </div>

                                            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 border border-blue-100/50 dark:border-gray-600">
                                                <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Bobot Jam Pengali</span>
                                                <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                                                    {calcResult.multiplier_hours} Jam Ekuivalen
                                                </span>
                                            </div>

                                            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 border border-blue-100/50 dark:border-gray-600 col-span-2 sm:col-span-2">
                                                <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Rincian Skema Pengali</span>
                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                    {calcResult.breakdown?.map((tier, idx) => (
                                                        <span key={idx} className="inline-flex items-center gap-1 text-[11px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded font-medium">
                                                            <strong>{tier.tier}:</strong> {tier.hours} jam x {tier.multiplier}x = Rp {new Intl.NumberFormat('id-ID').format(tier.subtotal)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={submitting}
                                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold shadow-md transition flex items-center gap-2 ${
                                            submitting 
                                                ? 'bg-blue-400 text-white cursor-not-allowed' 
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" /> Mengirim Pengajuan...
                                            </>
                                        ) : (
                                            <>
                                                <Clock size={16} /> Ajukan Lembur Sekarang
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Table Riwayat Pengajuan Lembur */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    Riwayat & Daftar Persetujuan Lembur
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Daftar pengajuan lembur karyawan dengan bobot pengali dan nominal terhitung.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                        {!isEmployee && <th className="p-4">Karyawan</th>}
                                        <th className="p-4">Tanggal & Tipe Hari</th>
                                        <th className="p-4">Waktu</th>
                                        <th className="p-4">Durasi & Pengali</th>
                                        <th className="p-4">Total Upah</th>
                                        <th className="p-4">Keterangan</th>
                                        <th className="p-4">Status</th>
                                        {showActionColumn && <th className="p-4 text-center">Aksi Persetujuan</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                    {loading ? (
                                        <tr><td colSpan="8" className="p-8 text-center text-gray-400">Memuat data lembur...</td></tr>
                                    ) : !Array.isArray(overtimes) || overtimes.length === 0 ? (
                                        <tr><td colSpan="8" className="p-8 text-center text-gray-400">Belum ada data lembur yang diajukan.</td></tr>
                                    ) : (
                                        overtimes.map(ot => (
                                            <tr key={ot.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                                {!isEmployee && (
                                                    <td className="p-4">
                                                        <div className="font-semibold text-gray-900 dark:text-white">{ot.employee?.user?.name || 'Karyawan'}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{ot.employee?.employee_code || '-'}</div>
                                                    </td>
                                                )}
                                                <td className="p-4 whitespace-nowrap">
                                                    <div className="font-medium text-gray-800 dark:text-gray-200">{ot.date}</div>
                                                    <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded ${
                                                        ot.day_type === 'holiday' 
                                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' 
                                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                                    }`}>
                                                        {ot.day_type === 'holiday' ? 'Hari Libur / Weekend' : 'Hari Kerja'}
                                                    </span>
                                                </td>
                                                <td className="p-4 whitespace-nowrap font-mono text-xs text-gray-700 dark:text-gray-300">
                                                    {ot.start_time?.substring(0, 5)} - {ot.end_time?.substring(0, 5)}
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <div className="font-semibold text-gray-800 dark:text-gray-200">
                                                        {ot.duration_hours} Jam
                                                    </div>
                                                    {ot.multiplier_hours > 0 && (
                                                        <button 
                                                            onClick={() => setSelectedBreakdown(ot)}
                                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                                                        >
                                                            <span>Bobot: <strong>{ot.multiplier_hours} jam</strong></span>
                                                            <Info size={12} />
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="p-4 whitespace-nowrap font-semibold text-indigo-600 dark:text-indigo-400">
                                                    {ot.total_pay > 0 ? (
                                                        `Rp ${new Intl.NumberFormat('id-ID').format(ot.total_pay)}`
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Dihitung otomatis</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-gray-600 dark:text-gray-300 max-w-xs truncate" title={ot.reason}>
                                                    {ot.reason}
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-block ${
                                                        ot.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' :
                                                        ot.status === 'rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300' : 
                                                        'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                                    }`}>
                                                        {ot.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                {showActionColumn && (
                                                    <td className="p-4 text-center whitespace-nowrap">
                                                        {canApprove(ot) ? (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button 
                                                                    onClick={() => updateStatus(ot.id, isEmployee ? 'pending_hr' : 'approved')} 
                                                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm transition" 
                                                                    title="Setujui Lembur"
                                                                >
                                                                    <CheckCircle size={14}/> Setujui
                                                                </button>
                                                                <button 
                                                                    onClick={() => updateStatus(ot.id, 'rejected')} 
                                                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm transition" 
                                                                    title="Tolak Lembur"
                                                                >
                                                                    <XCircle size={14}/> Tolak
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">Selesai</span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination meta={pagination} onPageChange={fetchOvertimes} />
                    </div>

                </div>
            </div>

            {/* Modal Detail Breakdown Pengali Lembur PP 35/2021 */}
            {selectedBreakdown && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 mb-4">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Rincian Pengali Lembur PP 35/2021
                            </h4>
                            <button 
                                onClick={() => setSelectedBreakdown(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Tanggal:</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedBreakdown.date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Tipe Hari:</span>
                                    <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase">
                                        {selectedBreakdown.day_type === 'holiday' ? 'Hari Libur / Akhir Pekan' : 'Hari Kerja Biasa'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Durasi Aktual:</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedBreakdown.duration_hours} Jam</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Bobot Pengali Depnaker:</span>
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        {selectedBreakdown.multiplier_hours} Jam Ekuivalen
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Upah Sejam (1/173):</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                        Rp {new Intl.NumberFormat('id-ID').format(selectedBreakdown.hourly_rate || 0)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                    Detail Skema Per Tier:
                                </h5>
                                {Array.isArray(selectedBreakdown.breakdown) && selectedBreakdown.breakdown.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedBreakdown.breakdown.map((tier, i) => (
                                            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 text-xs">
                                                <div>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200 block">{tier.tier}</span>
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        {tier.hours} jam x {tier.multiplier}x pengali
                                                    </span>
                                                </div>
                                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                    Rp {new Intl.NumberFormat('id-ID').format(tier.subtotal)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">Breakdown tier otomatis tersimpan pada sistem.</p>
                                )}
                            </div>

                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Total Upah Lembur:</span>
                                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                                    Rp {new Intl.NumberFormat('id-ID').format(selectedBreakdown.total_pay || 0)}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedBreakdown(null)}
                                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
