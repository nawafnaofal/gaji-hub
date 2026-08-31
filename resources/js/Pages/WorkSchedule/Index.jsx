import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Clock, PlusCircle, Trash2, Edit, Users, Check } from 'lucide-react';

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const defaultForm = {
    id: null,
    name: '',
    clock_in_time: '08:00',
    clock_out_time: '17:00',
    work_days: [1, 2, 3, 4, 5],
    late_tolerance_minutes: 15,
    description: ''
};

export default function WorkScheduleIndex({ auth }) {
    const [schedules, setSchedules] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(defaultForm);
    const [isEditing, setIsEditing] = useState(false);
    const [showAssign, setShowAssign] = useState(false);
    const [assignForm, setAssignForm] = useState({ employee_id: '', work_schedule_id: '' });

    useEffect(() => {
        fetchSchedules();
        fetchEmployees();
    }, []);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/v1/work-schedules');
            setSchedules(res.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get('/api/v1/employees');
            setEmployees(res.data.data);
        } catch (e) { console.error(e); }
    };

    const toggleDay = (day) => {
        setForm(prev => ({
            ...prev,
            work_days: prev.work_days.includes(day)
                ? prev.work_days.filter(d => d !== day)
                : [...prev.work_days, day].sort()
        }));
    };

    const submitForm = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axios.put(`/api/v1/work-schedules/${form.id}`, form);
            } else {
                await axios.post('/api/v1/work-schedules', form);
            }
            setForm(defaultForm);
            setIsEditing(false);
            fetchSchedules();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyimpan jadwal.');
        }
    };

    const handleEdit = (s) => {
        setIsEditing(true);
        setForm({
            id: s.id,
            name: s.name,
            clock_in_time: s.clock_in_time.substring(0, 5),
            clock_out_time: s.clock_out_time.substring(0, 5),
            work_days: s.work_days,
            late_tolerance_minutes: s.late_tolerance_minutes,
            description: s.description || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteSchedule = async (id) => {
        if (!confirm('Hapus jadwal ini? Karyawan yang terdaftar akan direset.')) return;
        await axios.delete(`/api/v1/work-schedules/${id}`);
        fetchSchedules();
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/v1/work-schedules/assign', assignForm);
            alert('Jadwal berhasil diassign ke karyawan!');
            setShowAssign(false);
            setAssignForm({ employee_id: '', work_schedule_id: '' });
            fetchEmployees();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal assign jadwal.');
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Jadwal Kerja & Shift</h2>}
        >
            <Head title="Jadwal Kerja" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Form */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                            {isEditing ? <Edit size={20} /> : <PlusCircle size={20} />}
                            {isEditing ? 'Edit Jadwal' : 'Buat Jadwal Baru'}
                        </h3>
                        <form onSubmit={submitForm} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Jadwal</label>
                                    <input required type="text" className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        placeholder="Contoh: Shift Pagi, Office Hours"
                                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jam Masuk</label>
                                    <input required type="time" className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        value={form.clock_in_time} onChange={e => setForm({ ...form, clock_in_time: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jam Keluar</label>
                                    <input required type="time" className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        value={form.clock_out_time} onChange={e => setForm({ ...form, clock_out_time: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hari Kerja</label>
                                <div className="flex flex-wrap gap-2">
                                    {DAY_NAMES.map((day, i) => (
                                        <button key={i} type="button"
                                            onClick={() => toggleDay(i)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${form.work_days.includes(i)
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                            }`}>
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Toleransi Terlambat (menit)</label>
                                    <input type="number" min="0" max="120" className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        value={form.late_tolerance_minutes} onChange={e => setForm({ ...form, late_tolerance_minutes: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keterangan (opsional)</label>
                                    <input type="text" className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">
                                    {isEditing ? 'Simpan Perubahan' : 'Buat Jadwal'}
                                </button>
                                {isEditing && (
                                    <button type="button" onClick={() => { setIsEditing(false); setForm(defaultForm); }}
                                        className="bg-gray-400 text-white px-5 py-2 rounded-lg hover:bg-gray-500">
                                        Batal
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Schedules List */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2 dark:text-white"><Clock size={20} /> Daftar Jadwal</h3>
                            <button onClick={() => setShowAssign(!showAssign)}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                                <Users size={16} /> Assign ke Karyawan
                            </button>
                        </div>

                        {/* Assign Panel */}
                        {showAssign && (
                            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">Assign Jadwal ke Karyawan</h4>
                                <form onSubmit={handleAssign} className="flex flex-wrap gap-3 items-end">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Karyawan</label>
                                        <select required className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                                            value={assignForm.employee_id} onChange={e => setAssignForm({ ...assignForm, employee_id: e.target.value })}>
                                            <option value="">Pilih Karyawan...</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.user?.name} ({emp.work_schedule?.name || 'Belum ada jadwal'})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Jadwal</label>
                                        <select required className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                                            value={assignForm.work_schedule_id} onChange={e => setAssignForm({ ...assignForm, work_schedule_id: e.target.value })}>
                                            <option value="">Pilih Jadwal...</option>
                                            {schedules.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.clock_in_time?.substring(0,5)} - {s.clock_out_time?.substring(0,5)})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1">
                                        <Check size={14} /> Assign
                                    </button>
                                </form>
                            </div>
                        )}

                        {loading ? (
                            <p className="text-center text-gray-500 py-8">Memuat jadwal...</p>
                        ) : schedules.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">Belum ada jadwal kerja. Buat jadwal di atas.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {schedules.map(s => (
                                    <div key={s.id} className="border dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-700/50">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-white text-base">{s.name}</h4>
                                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{s.employees_count} karyawan</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"><Edit size={14} /></button>
                                                <button onClick={() => deleteSchedule(s.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 text-sm">
                                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                <Clock size={14} className="text-gray-400" />
                                                <span className="font-semibold">{s.clock_in_time?.substring(0,5)}</span>
                                                <span className="text-gray-400">–</span>
                                                <span className="font-semibold">{s.clock_out_time?.substring(0,5)}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {DAY_NAMES.map((day, i) => (
                                                    <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.work_days?.includes(i)
                                                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                                    }`}>{day.substring(0, 3)}</span>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Toleransi terlambat: {s.late_tolerance_minutes} menit</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
