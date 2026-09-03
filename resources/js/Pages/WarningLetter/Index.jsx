import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { AlertTriangle, PlusCircle, Download, FileText, CheckCircle2, XCircle, Clock, ShieldAlert } from 'lucide-react';
import Modal from '@/Components/Modal';

export default function WarningLetterIndex({ auth }) {
    const [letters, setLetters] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    
    const [formData, setFormData] = useState({
        employee_id: '',
        sp_level: 'sp_1',
        violation_date: new Date().toISOString().split('T')[0],
        description: '',
        sanction: ''
    });

    const isHrOrAdmin = ['admin', 'hr'].includes(auth.user.role);

    const fetchLetters = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/v1/warning-letters');
            setLetters(res.data.data);
        } catch (error) {
            console.error("Error fetching warning letters", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        if (!isHrOrAdmin) return;
        try {
            const res = await axios.get('/api/v1/employees');
            setEmployees(res.data.data);
        } catch (error) {
            console.error("Error fetching employees", error);
        }
    };

    useEffect(() => {
        fetchLetters();
        fetchEmployees();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/v1/warning-letters', formData);
            setShowModal(false);
            setFormData({
                employee_id: '',
                sp_level: 'sp_1',
                violation_date: new Date().toISOString().split('T')[0],
                description: '',
                sanction: ''
            });
            fetchLetters();
            alert('Surat Peringatan berhasil diterbitkan!');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Gagal menerbitkan Surat Peringatan.');
        }
    };

    const handleRevoke = async (id) => {
        if (!confirm('Cabut Surat Peringatan ini sebelum masa berlaku habis?')) return;
        try {
            await axios.put(`/api/v1/warning-letters/${id}/revoke`);
            fetchLetters();
            alert('Surat Peringatan telah berhasil dicabut.');
        } catch (error) {
            alert('Gagal mencabut Surat Peringatan.');
        }
    };

    const filteredLetters = letters.filter(l => {
        if (statusFilter === 'all') return true;
        return l.status === statusFilter;
    });

    const activeCount = letters.filter(l => l.status === 'active').length;

    const getLevelBadge = (level) => {
        if (level === 'sp_3') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">SP 3 (Terakhir)</span>;
        if (level === 'sp_2') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">SP 2 (Teguran Keras)</span>;
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">SP 1 (Peringatan)</span>;
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Surat Peringatan & Disiplin</h2>}
        >
            <Head title="Surat Peringatan" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header Banner */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl">
                                <ShieldAlert size={28} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Rekapitulasi Surat Peringatan (SP)</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Pencatatan pelanggaran tata tertib kerja resmi sesuai regulasi ketenagakerjaan (Masa berlaku 6 bulan).
                                </p>
                            </div>
                        </div>
                        {isHrOrAdmin && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition shadow-sm"
                            >
                                <PlusCircle size={18} /> Terbitkan SP Baru
                            </button>
                        )}
                    </div>

                    {/* Stats & Filters */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border dark:border-gray-700'}`}
                            >
                                Semua ({letters.length})
                            </button>
                            <button
                                onClick={() => setStatusFilter('active')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === 'active' ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border dark:border-gray-700'}`}
                            >
                                Masih Aktif ({activeCount})
                            </button>
                            <button
                                onClick={() => setStatusFilter('expired')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === 'expired' ? 'bg-gray-700 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border dark:border-gray-700'}`}
                            >
                                Kedaluwarsa
                            </button>
                            <button
                                onClick={() => setStatusFilter('revoked')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === 'revoked' ? 'bg-gray-700 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border dark:border-gray-700'}`}
                            >
                                Dicabut
                            </button>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b dark:border-gray-700">
                                        <th className="p-4 font-semibold">Nomor & Tingkat</th>
                                        <th className="p-4 font-semibold">Karyawan</th>
                                        <th className="p-4 font-semibold">Tanggal Pelanggaran</th>
                                        <th className="p-4 font-semibold">Masa Berlaku (6 Bln)</th>
                                        <th className="p-4 font-semibold">Keterangan Pelanggaran</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                    {loading ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">Memuat data Surat Peringatan...</td></tr>
                                    ) : filteredLetters.length === 0 ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">Tidak ada Surat Peringatan yang tercatat.</td></tr>
                                    ) : (
                                        filteredLetters.map(l => (
                                            <tr key={l.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition">
                                                <td className="p-4">
                                                    <div className="font-bold text-gray-900 dark:text-white">{l.letter_number}</div>
                                                    <div className="mt-1">{getLevelBadge(l.sp_level)}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-semibold text-gray-900 dark:text-white">{l.employee?.user?.name}</div>
                                                    <div className="text-xs text-gray-500">{l.employee?.employee_code} • {l.employee?.department_id}</div>
                                                </td>
                                                <td className="p-4 text-gray-600 dark:text-gray-300">
                                                    {l.violation_date}
                                                </td>
                                                <td className="p-4 text-gray-600 dark:text-gray-300 font-medium">
                                                    s/d {l.valid_until}
                                                </td>
                                                <td className="p-4 text-gray-600 dark:text-gray-300 max-w-xs">
                                                    <p className="line-clamp-2">{l.description}</p>
                                                    {l.sanction && <p className="text-xs text-red-500 mt-0.5">Sanksi: {l.sanction}</p>}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                                        l.status === 'active' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                                                        l.status === 'expired' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                                                        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                    }`}>
                                                        {l.status === 'active' ? '● Aktif' : l.status === 'expired' ? 'Kedaluwarsa' : 'Dicabut'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <a
                                                            href={`/api/v1/warning-letters/${l.id}/download-pdf`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                                                            title="Unduh PDF Resmi"
                                                        >
                                                            <Download size={14} /> Unduh PDF
                                                        </a>
                                                        {isHrOrAdmin && l.status === 'active' && (
                                                            <button
                                                                onClick={() => handleRevoke(l.id)}
                                                                className="px-2.5 py-1.5 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 dark:bg-gray-700 dark:hover:bg-red-900/40 dark:text-gray-300 text-xs font-semibold rounded-lg transition"
                                                                title="Cabut SP"
                                                            >
                                                                Cabut
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
                    </div>
                </div>
            </div>

            {/* Modal Terbitkan SP Baru */}
            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="lg">
                <div className="p-6 text-gray-900 dark:text-gray-100">
                    <div className="flex justify-between items-center border-b dark:border-gray-700 pb-3 mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                            <ShieldAlert size={20} /> Penerbitan Surat Peringatan (SP)
                        </h3>
                        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Karyawan Penerima SP</label>
                            <select
                                required
                                value={formData.employee_id}
                                onChange={e => setFormData({...formData, employee_id: e.target.value})}
                                className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                            >
                                <option value="">Pilih Karyawan...</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.user?.name} ({emp.employee_code} - {emp.department_id})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Tingkat Surat Peringatan</label>
                                <select
                                    value={formData.sp_level}
                                    onChange={e => setFormData({...formData, sp_level: e.target.value})}
                                    className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm font-semibold"
                                >
                                    <option value="sp_1">SP 1 (Peringatan Pertama)</option>
                                    <option value="sp_2">SP 2 (Peringatan Kedua)</option>
                                    <option value="sp_3">SP 3 (Peringatan Terakhir)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Tanggal Pelanggaran</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.violation_date}
                                    onChange={e => setFormData({...formData, violation_date: e.target.value})}
                                    className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Kronologi / Bentuk Pelanggaran</label>
                            <textarea
                                required
                                rows="3"
                                placeholder="Jelaskan detail pelanggaran SOP, mangkir kerja, atau pelanggaran tata tertib..."
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Sanksi / Tindakan Disiplin (Opsional)</label>
                            <input
                                type="text"
                                placeholder="Contoh: Skorsing 3 hari kerja, penundaan kenaikan gaji, dll."
                                value={formData.sanction}
                                onChange={e => setFormData({...formData, sanction: e.target.value})}
                                className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                            />
                        </div>

                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                            <Clock size={16} className="shrink-0 mt-0.5" />
                            <span>Surat Peringatan ini otomatis berlaku selama <strong>6 bulan</strong> terhitung sejak tanggal pelanggaran.</span>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-sm font-semibold rounded-xl text-white shadow-sm"
                            >
                                Terbitkan SP
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
