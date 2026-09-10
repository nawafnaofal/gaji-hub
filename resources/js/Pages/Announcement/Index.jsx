import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    Megaphone, Pin, PinOff, Plus, Trash2, CheckCircle, Clock, 
    FileText, Download, Eye, AlertCircle, Calendar, Sparkles, 
    Check, X, Search, Filter, Paperclip, Users, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AnnouncementIndex({ auth }) {
    const [announcements, setAnnouncements] = useState([]);
    const [summary, setSummary] = useState({ total: 0, unread: 0, pinned: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Create Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        title: '',
        content: '',
        category: 'general',
        is_pinned: false,
        target_department: '',
    });
    const [attachmentFile, setAttachmentFile] = useState(null);

    // Read Stats Modal (HR only)
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [selectedStats, setSelectedStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);

    const isAdminOrHr = ['admin', 'hr'].includes(auth.user.role);

    useEffect(() => {
        fetchAnnouncements();
    }, [selectedCategory, searchQuery]);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/v1/announcements', {
                params: {
                    category: selectedCategory || undefined,
                    search: searchQuery || undefined,
                }
            });
            if (res.data.success) {
                setAnnouncements(res.data.data || []);
                setSummary(res.data.summary || { total: 0, unread: 0, pinned: 0 });
            }
        } catch (error) {
            console.error('Error fetching announcements', error);
            toast.error('Gagal memuat feed pengumuman.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAnnouncement = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('content', form.content);
            formData.append('category', form.category);
            formData.append('is_pinned', form.is_pinned ? '1' : '0');
            if (form.target_department) {
                formData.append('target_department', form.target_department);
            }
            if (attachmentFile) {
                formData.append('attachment', attachmentFile);
            }

            const res = await axios.post('/api/v1/announcements', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                toast.success('Pengumuman berhasil disiarkan ke feed!');
                setShowCreateModal(false);
                setForm({
                    title: '',
                    content: '',
                    category: 'general',
                    is_pinned: false,
                    target_department: '',
                });
                setAttachmentFile(null);
                fetchAnnouncements();
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Gagal membuat pengumuman.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            const res = await axios.post(`/api/v1/announcements/${id}/read`);
            if (res.data.success) {
                toast.success('Ditandai telah dibaca!');
                setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_read_by_me: true, reads_count: a.reads_count + 1 } : a));
            }
        } catch (error) {
            console.error(error);
            toast.error('Gagal memperbarui status baca.');
        }
    };

    const handleTogglePin = async (id) => {
        try {
            const res = await axios.put(`/api/v1/announcements/${id}/pin`);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchAnnouncements();
            }
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengubah status pin.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus pengumuman ini secara permanen?')) return;
        try {
            const res = await axios.delete(`/api/v1/announcements/${id}`);
            if (res.data.success) {
                toast.success('Pengumuman berhasil dihapus.');
                fetchAnnouncements();
            }
        } catch (error) {
            console.error(error);
            toast.error('Gagal menghapus pengumuman.');
        }
    };

    const handleOpenStats = async (id) => {
        setShowStatsModal(true);
        setStatsLoading(true);
        try {
            const res = await axios.get(`/api/v1/announcements/${id}/stats`);
            if (res.data.success) {
                setSelectedStats(res.data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat statistik pembaca.');
        } finally {
            setStatsLoading(false);
        }
    };

    const getCategoryBadge = (category) => {
        switch (category) {
            case 'urgent':
                return {
                    label: 'PENTING / DARURAT',
                    classes: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
                    icon: AlertCircle
                };
            case 'policy':
                return {
                    label: 'KEBIJAKAN & SOP',
                    classes: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
                    icon: FileText
                };
            case 'event':
                return {
                    label: 'KEGIATAN / ACARA',
                    classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                    icon: Calendar
                };
            default:
                return {
                    label: 'PENGUMUMAN UMUM',
                    classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                    icon: Megaphone
                };
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight flex items-center gap-2">
                            <Megaphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            Feed Pengumuman Perusahaan
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Pusat informasi, memo direksi, kebijakan kerja, dan pengumuman resmi perusahaan ala Talenta Feed.
                        </p>
                    </div>

                    {isAdminOrHr && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                        >
                            <Plus size={16} /> Buat Pengumuman Baru
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Feed Pengumuman" />

            <div className="py-8">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Filter & Category Bar */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Categories */}
                        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                            {[
                                { id: '', label: 'Semua' },
                                { id: 'urgent', label: 'Penting / Darurat' },
                                { id: 'policy', label: 'Kebijakan' },
                                { id: 'event', label: 'Acara' },
                                { id: 'general', label: 'Umum' },
                            ].map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                        selectedCategory === cat.id
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari judul pengumuman..."
                                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                            />
                        </div>
                    </div>

                    {/* Announcements Stream */}
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">
                            <Loader2 size={28} className="animate-spin mx-auto mb-2 text-blue-600" />
                            Memuat feed pengumuman...
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-100 dark:border-gray-700">
                            <Megaphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <h4 className="text-base font-bold text-gray-700 dark:text-gray-300">Belum Ada Pengumuman</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
                                Belum ada pengumuman yang sesuai dengan filter pencarian ini.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {announcements.map((ann) => {
                                const badge = getCategoryBadge(ann.category);
                                const BadgeIcon = badge.icon;

                                return (
                                    <div
                                        key={ann.id}
                                        className={`bg-white dark:bg-gray-800 rounded-xl border transition shadow-sm overflow-hidden ${
                                            ann.is_pinned 
                                                ? 'border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-200/50 dark:ring-indigo-800/50' 
                                                : 'border-gray-100 dark:border-gray-700'
                                        }`}
                                    >
                                        {/* Pinned Ribbon */}
                                        {ann.is_pinned && (
                                            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[11px] font-bold px-4 py-1 flex items-center gap-1.5 shadow-sm">
                                                <Pin size={12} className="rotate-45" />
                                                <span>PENGUMUMAN DISEMATKAN (PINNED)</span>
                                            </div>
                                        )}

                                        <div className="p-6">
                                            {/* Header Card */}
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.classes}`}>
                                                            <BadgeIcon size={12} />
                                                            {badge.label}
                                                        </span>

                                                        {ann.target_department && (
                                                            <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                                                                Divisi: {ann.target_department}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {ann.title}
                                                    </h3>

                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                                        <span>Disiarkan oleh <strong>{ann.creator?.name || 'Manajemen'}</strong></span>
                                                        <span>•</span>
                                                        <span>{new Date(ann.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                    </div>
                                                </div>

                                                {/* Admin Actions */}
                                                {isAdminOrHr && (
                                                    <div className="flex items-center gap-1.5 self-start">
                                                        <button
                                                            onClick={() => handleTogglePin(ann.id)}
                                                            className={`p-1.5 rounded-lg border text-xs transition ${
                                                                ann.is_pinned 
                                                                    ? 'border-indigo-300 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                                                                    : 'border-gray-200 text-gray-400 hover:text-gray-600 dark:border-gray-700'
                                                            }`}
                                                            title={ann.is_pinned ? 'Lepas Sematan' : 'Sematkan Pengumuman'}
                                                        >
                                                            {ann.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                                                        </button>

                                                        <button
                                                            onClick={() => handleOpenStats(ann.id)}
                                                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-blue-600 dark:text-gray-400 text-xs transition"
                                                            title="Statistik Pembaca"
                                                        >
                                                            <Users size={16} />
                                                        </button>

                                                        <button
                                                            onClick={() => handleDelete(ann.id)}
                                                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-rose-600 dark:border-gray-700 text-xs transition"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed mb-4">
                                                {ann.content}
                                            </div>

                                            {/* Attachment Preview (if any) */}
                                            {ann.attachment_path && (
                                                <div className="mb-4">
                                                    <a
                                                        href={`/storage/${ann.attachment_path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/60 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-600 transition"
                                                    >
                                                        <Paperclip size={14} className="text-blue-600 dark:text-blue-400" />
                                                        <span>Lampiran Dokumen Resmi</span>
                                                        <Download size={12} className="ml-1 text-gray-400" />
                                                    </a>
                                                </div>
                                            )}

                                            {/* Footer Interaction Bar */}
                                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                                {/* Read Stats */}
                                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                    <CheckCircle size={14} className="text-emerald-500" />
                                                    <span>Dibaca oleh <strong>{ann.reads_count}</strong> dari {ann.total_employees} karyawan ({ann.read_percentage}%)</span>
                                                </div>

                                                {/* Employee Read Action Button */}
                                                <div>
                                                    {ann.is_read_by_me ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full text-xs border border-emerald-200 dark:border-emerald-800">
                                                            <Check size={14} /> Telah Dibaca
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleMarkAsRead(ann.id)}
                                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition"
                                                        >
                                                            <Check size={14} /> Tandai Telah Dibaca
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>
            </div>

            {/* MODAL BUAT PENGUMUMAN */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 mb-4">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-blue-600" />
                                Siarkan Pengumuman Perusahaan
                            </h4>
                            <button 
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                    Judul Pengumuman
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Jadwal Libur Lebaran & Surat Keputusan Direksi"
                                    value={form.title}
                                    onChange={e => setForm({...form, title: e.target.value})}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        Kategori
                                    </label>
                                    <select
                                        value={form.category}
                                        onChange={e => setForm({...form, category: e.target.value})}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 text-sm"
                                    >
                                        <option value="general">Pengumuman Umum</option>
                                        <option value="urgent">Penting / Darurat (Blast Notif)</option>
                                        <option value="policy">Kebijakan & SOP Baru</option>
                                        <option value="event">Kegiatan / Acara Kantor</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        Target Divisi
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Kosongkan untuk Semua Divisi"
                                        value={form.target_department}
                                        onChange={e => setForm({...form, target_department: e.target.value})}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                    Isi Memo / Pesan Pengumuman
                                </label>
                                <textarea
                                    required
                                    rows="5"
                                    placeholder="Tuliskan isi pengumuman secara rinci di sini..."
                                    value={form.content}
                                    onChange={e => setForm({...form, content: e.target.value})}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                    Lampiran Dokumen / Memo (PDF, Gambar)
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                    onChange={e => setAttachmentFile(e.target.files[0] || null)}
                                    className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="is_pinned"
                                    checked={form.is_pinned}
                                    onChange={e => setForm({...form, is_pinned: e.target.checked})}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_pinned" className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                                    Sematkan pengumuman ini di bagian paling atas feed (Pin)
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow flex items-center gap-1.5"
                                >
                                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Megaphone size={14} />}
                                    Siarkan Pengumuman
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL STATISTIK PEMBACA (HR ONLY) */}
            {showStatsModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 mb-4">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                Rincian Tanda Telah Dibaca (Read Receipts)
                            </h4>
                            <button 
                                onClick={() => setShowStatsModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {statsLoading ? (
                            <div className="p-8 text-center text-gray-400">Memuat data pembaca...</div>
                        ) : selectedStats ? (
                            <div className="flex-1 overflow-y-auto space-y-4">
                                <div className="grid grid-cols-2 gap-3 text-center">
                                    <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 block">Telah Membaca</span>
                                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedStats.total_read} Orang</span>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 block">Belum Membaca</span>
                                        <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{selectedStats.total_unread} Orang</span>
                                    </div>
                                </div>

                                <div>
                                    <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                        Daftar Karyawan yang Telah Membaca:
                                    </h5>
                                    {selectedStats.readers.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">Belum ada karyawan yang menandai telah membaca.</p>
                                    ) : (
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700 text-xs">
                                            {selectedStats.readers.map((r, i) => (
                                                <div key={i} className="py-2 flex justify-between items-center">
                                                    <div>
                                                        <span className="font-semibold text-gray-800 dark:text-gray-200 block">{r.name}</span>
                                                        <span className="text-gray-400">{r.department}</span>
                                                    </div>
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">{r.read_at}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                            <button
                                onClick={() => setShowStatsModal(false)}
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
