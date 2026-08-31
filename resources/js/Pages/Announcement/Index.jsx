import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Megaphone, Trash2, Plus, Edit, CheckCircle, XCircle } from 'lucide-react';

export default function AnnouncementIndex({ auth }) {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ title: '', content: '', is_active: true });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/v1/announcements');
            setAnnouncements(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/v1/announcements', form);
            setForm({ title: '', content: '', is_active: true });
            fetchAnnouncements();
            alert('Pengumuman berhasil dibuat.');
        } catch (error) {
            alert('Gagal membuat pengumuman.');
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            await axios.put(`/api/v1/announcements/${id}`, { is_active: !currentStatus });
            fetchAnnouncements();
        } catch (error) {
            alert('Gagal mengupdate status pengumuman.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus pengumuman ini?')) return;
        try {
            await axios.delete(`/api/v1/announcements/${id}`);
            fetchAnnouncements();
        } catch (error) {
            alert('Gagal menghapus pengumuman.');
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Papan Pengumuman</h2>}
        >
            <Head title="Pengumuman" />

            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 dark:text-white">
                            <Plus size={20} /> Buat Pengumuman Baru
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Judul Pengumuman</label>
                                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Isi Pengumuman</label>
                                <textarea required rows="3" value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"></textarea>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <label htmlFor="is_active" className="text-sm dark:text-gray-300">Aktif (Tampil di Dashboard)</label>
                            </div>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition text-sm">
                                Posting Pengumuman
                            </button>
                        </form>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 dark:text-white">
                            <Megaphone size={20} /> Daftar Pengumuman
                        </h3>
                        <div className="space-y-4">
                            {loading ? (
                                <p className="text-gray-500 text-center py-4">Memuat...</p>
                            ) : announcements.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">Belum ada pengumuman.</p>
                            ) : (
                                announcements.map(a => (
                                    <div key={a.id} className={`p-4 rounded-lg border ${a.is_active ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800' : 'border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className={`font-bold text-lg ${a.is_active ? 'text-blue-800 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>{a.title}</h4>
                                            <div className="flex gap-2">
                                                <button onClick={() => toggleStatus(a.id, a.is_active)} title={a.is_active ? 'Nonaktifkan' : 'Aktifkan'} className={`p-1 rounded ${a.is_active ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-500 hover:bg-gray-200'}`}>
                                                    {a.is_active ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                                </button>
                                                <button onClick={() => handleDelete(a.id)} title="Hapus" className="p-1 text-red-500 hover:bg-red-100 rounded">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-sm mb-3">{a.content}</p>
                                        <div className="text-xs text-gray-500 flex justify-between">
                                            <span>Oleh: {a.creator?.name || 'Sistem'}</span>
                                            <span>{new Date(a.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
