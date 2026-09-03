import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { FileText, CheckCircle, XCircle, Eye, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LeaveIndex({ auth }) {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [viewMode, setViewMode] = useState('table');
    const [calendarData, setCalendarData] = useState({ leaves: [], holidays: [] });
    const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
    const [calYear, setCalYear] = useState(new Date().getFullYear());

    const [form, setForm] = useState({
        type: 'annual',
        start_date: '',
        end_date: '',
        reason: '',
        attachment: null
    });

    const isEmployee = auth.user.role === 'employee';

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchCalendarData = async () => {
        try {
            const res = await axios.get('/api/v1/leaves/calendar', {
                params: { month: calMonth, year: calYear }
            });
            setCalendarData(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (viewMode === 'calendar') {
            fetchCalendarData();
        }
    }, [viewMode, calMonth, calYear]);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/leaves');
            setLeaves(response.data.data);
        } catch (error) {
            console.error("Error fetching leaves", error);
        } finally {
            setLoading(false);
        }
    };

    const submitLeave = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('type', form.type);
        formData.append('start_date', form.start_date);
        formData.append('end_date', form.end_date);
        formData.append('reason', form.reason);
        if (form.attachment) {
            formData.append('attachment', form.attachment);
        }

        try {
            await axios.post('/api/v1/leaves', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('Cuti berhasil diajukan!');
            setForm({ type: 'annual', start_date: '', end_date: '', reason: '', attachment: null });
            fetchLeaves();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Gagal mengajukan cuti.');
        }
    };

    const updateStatus = async (id, status) => {
        if (!confirm(`Anda yakin ingin memproses ini?`)) return;
        try {
            await axios.put(`/api/v1/leaves/${id}`, { status });
            fetchLeaves();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Gagal mengupdate status.');
        }
    };

    const canApprove = (leave) => {
        if (!isEmployee) {
            return leave.status === 'pending_hr' || leave.status === 'pending';
        }
        return leave.employee?.user_id !== auth.user.id && leave.status === 'pending_manager';
    };

    const showActionColumn = !isEmployee || leaves.some(canApprove);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Manajemen Cuti</h2>}
        >
            <Head title="Cuti" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {isEmployee && (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
                                <h3 className="text-lg font-bold flex items-center gap-2 dark:text-white">
                                    <FileText size={20} /> Form Pengajuan Cuti
                                </h3>
                                <div className="text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full font-medium border border-blue-200 dark:border-blue-800">
                                    Sisa Cuti Tahunan: {auth.user.employee?.leave_balance ?? 0} Hari
                                </div>
                            </div>
                            <form onSubmit={submitLeave} className="space-y-4 max-w-2xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipe Cuti</label>
                                    <select 
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={form.type}
                                        onChange={e => setForm({...form, type: e.target.value})}
                                    >
                                        <option value="annual">Tahunan (Annual)</option>
                                        <option value="sick">Sakit (Sick)</option>
                                        <option value="unpaid">Cuti di Luar Tanggungan (Unpaid)</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Mulai</label>
                                        <input type="date" required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Selesai</label>
                                        <input type="date" required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alasan / Keterangan</label>
                                    <textarea required rows="3" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lampiran (Opsional, Wajib untuk Cuti Sakit)</label>
                                    <input type="file" accept="image/*,.pdf" className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/50 dark:file:text-blue-300" onChange={e => setForm({...form, attachment: e.target.files[0]})} />
                                </div>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Ajukan Cuti</button>
                            </form>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b dark:border-gray-700 pb-4">
                            <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                                {viewMode === 'table' ? <FileText size={20} /> : <CalendarIcon size={20} className="text-blue-600" />}
                                {viewMode === 'table' ? 'Riwayat Pengajuan Cuti' : `Kalender Cuti Tim (${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][calMonth - 1]} ${calYear})`}
                            </h3>
                            <div className="flex items-center gap-3">
                                {viewMode === 'calendar' && (
                                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                        <button
                                            onClick={() => {
                                                if (calMonth === 1) { setCalMonth(12); setCalYear(calYear - 1); }
                                                else { setCalMonth(calMonth - 1); }
                                            }}
                                            className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="text-xs font-bold px-2 text-gray-700 dark:text-gray-300">
                                            {calMonth} / {calYear}
                                        </span>
                                        <button
                                            onClick={() => {
                                                if (calMonth === 12) { setCalMonth(1); setCalYear(calYear + 1); }
                                                else { setCalMonth(calMonth + 1); }
                                            }}
                                            className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                                <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-xl flex gap-1">
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${viewMode === 'table' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
                                    >
                                        Tabel Pengajuan
                                    </button>
                                    <button
                                        onClick={() => setViewMode('calendar')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
                                    >
                                        📅 Kalender Tim
                                    </button>
                                </div>
                            </div>
                        </div>

                        {viewMode === 'calendar' ? (
                            <div>
                                <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 text-xs">
                                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((d, i) => (
                                        <div key={d} className={`p-2 text-center font-bold uppercase ${i >= 5 ? 'bg-red-50 dark:bg-red-950/20 text-red-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                                            {d}
                                        </div>
                                    ))}

                                    {(() => {
                                        const daysInMonth = new Date(calYear, calMonth, 0).getDate();
                                        const firstDayIndex = (new Date(calYear, calMonth - 1, 1).getDay() + 6) % 7; // Monday = 0
                                        const cells = [];

                                        // Padding previous month
                                        for (let p = 0; p < firstDayIndex; p++) {
                                            cells.push(<div key={`pad-${p}`} className="min-h-[90px] bg-gray-50/50 dark:bg-gray-800/40 p-1.5 opacity-40"></div>);
                                        }

                                        // Current month days
                                        for (let d = 1; d <= daysInMonth; d++) {
                                            const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                            const dayOfWeek = (firstDayIndex + d - 1) % 7;
                                            const isWeekend = dayOfWeek >= 5;

                                            const dayLeaves = calendarData.leaves?.filter(l => l.start_date <= dateStr && l.end_date >= dateStr) || [];
                                            const dayHolidays = calendarData.holidays?.filter(h => h.date === dateStr) || [];

                                            cells.push(
                                                <div key={d} className={`min-h-[90px] p-1.5 transition ${isWeekend ? 'bg-red-50/20 dark:bg-red-950/10' : 'bg-white dark:bg-gray-800'} hover:bg-blue-50/30 dark:hover:bg-blue-900/10 border-t border-gray-100 dark:border-gray-700/50`}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`text-xs font-bold ${isWeekend || dayHolidays.length > 0 ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>
                                                            {d}
                                                        </span>
                                                        {dayHolidays.length > 0 && (
                                                            <span className="text-[9px] bg-red-100 dark:bg-red-900/40 text-red-600 font-bold px-1 rounded truncate max-w-[70px]">
                                                                Libur
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1 overflow-y-auto max-h-[60px] custom-scrollbar">
                                                        {dayHolidays.map((h, hi) => (
                                                            <div key={`h-${hi}`} className="text-[10px] p-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded font-medium truncate" title={h.name}>
                                                                🎉 {h.name}
                                                            </div>
                                                        ))}
                                                        {dayLeaves.map((l, li) => (
                                                            <div key={`l-${li}`} className={`text-[10px] p-1 rounded font-medium truncate ${l.type === 'sick' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'}`} title={`${l.employee_name} (${l.type}): ${l.reason}`}>
                                                                👤 {l.employee_name.split(' ')[0]} ({l.type === 'sick' ? 'Sakit' : 'Cuti'})
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return cells;
                                    })()}
                                </div>
                            </div>
                        ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                        {!isEmployee || leaves.some(l => l.employee?.user_id !== auth.user.id) ? (
                                            <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Karyawan</th>
                                        ) : null}
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Tipe</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Keterangan</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Lampiran</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                        {showActionColumn && <th className="p-4 font-semibold text-gray-700 dark:text-gray-300 text-center">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="6" className="p-4 text-center dark:text-gray-400">Memuat data...</td></tr>
                                    ) : leaves.length === 0 ? (
                                        <tr><td colSpan="6" className="p-4 text-center dark:text-gray-400">Belum ada pengajuan cuti.</td></tr>
                                    ) : (
                                        leaves.map(leave => (
                                            <tr key={leave.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                {(!isEmployee || leaves.some(l => l.employee?.user_id !== auth.user.id)) && (
                                                    <td className="p-4">
                                                        <div className="font-medium text-gray-800 dark:text-gray-200">{leave.employee?.user?.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{leave.employee?.employee_code}</div>
                                                    </td>
                                                )}
                                                <td className="p-4 whitespace-nowrap dark:text-gray-300">{leave.start_date} s/d {leave.end_date}</td>
                                                <td className="p-4 uppercase text-xs font-semibold dark:text-gray-300">{leave.type}</td>
                                                <td className="p-4 text-gray-600 dark:text-gray-400">{leave.reason}</td>
                                                <td className="p-4">
                                                    {leave.attachment_url ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewUrl(leave.attachment_url)} 
                                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs font-semibold flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded transition"
                                                        >
                                                            <Eye size={14} /> Preview
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                        leave.status === 'approved' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' :
                                                        leave.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400' : 
                                                        'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
                                                    }`}>
                                                        {leave.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                {showActionColumn && (
                                                    <td className="p-4 text-center space-x-2">
                                                        {canApprove(leave) && (
                                                            <>
                                                                <button onClick={() => updateStatus(leave.id, isEmployee ? 'pending_hr' : 'approved')} className="text-green-600 hover:text-green-800" title="Setujui"><CheckCircle size={20}/></button>
                                                                <button onClick={() => updateStatus(leave.id, 'rejected')} className="text-red-600 hover:text-red-800" title="Tolak"><XCircle size={20}/></button>
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
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Quick Preview Surat/Lampiran Cuti */}
            {previewUrl && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-5 overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center pb-3 border-b dark:border-gray-700">
                            <h4 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                                <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                                Surat Keterangan Dokter / Lampiran Cuti
                            </h4>
                            <button onClick={() => setPreviewUrl(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold">&times;</button>
                        </div>
                        <div className="my-4 max-h-[65vh] flex items-center justify-center overflow-auto rounded-xl bg-gray-100 dark:bg-gray-900 p-2">
                            {previewUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i) || previewUrl.startsWith('data:image') || !previewUrl.endsWith('.pdf') ? (
                                <img src={previewUrl} alt="Lampiran Cuti" className="max-h-[60vh] object-contain rounded-lg shadow-sm" />
                            ) : (
                                <iframe src={previewUrl} className="w-full h-[60vh] rounded border-0" title="Dokumen PDF" />
                            )}
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                Buka di Tab Baru &rarr;
                            </a>
                            <button onClick={() => setPreviewUrl(null)} className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-lg transition">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
