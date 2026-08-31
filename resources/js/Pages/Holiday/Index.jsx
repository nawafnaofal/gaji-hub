import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Calendar, Trash2, Plus } from 'lucide-react';

export default function HolidayIndex({ auth }) {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ date: '', description: '' });

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/v1/holidays');
            setHolidays(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/v1/holidays', form);
            setForm({ date: '', description: '' });
            fetchHolidays();
            alert('Hari libur berhasil ditambahkan.');
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal menambahkan hari libur.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus hari libur ini?')) return;
        try {
            await axios.delete(`/api/v1/holidays/${id}`);
            fetchHolidays();
        } catch (error) {
            alert('Gagal menghapus hari libur.');
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Kalender Libur Nasional</h2>}
        >
            <Head title="Hari Libur" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 dark:text-white">
                            <Plus size={20} /> Tambah Hari Libur Baru
                        </h3>
                        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Tanggal</label>
                                <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Keterangan / Nama Libur</label>
                                <input type="text" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Contoh: Hari Kemerdekaan RI" className="w-full rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm" />
                            </div>
                            <div className="flex items-end">
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition text-sm whitespace-nowrap">
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 dark:text-white">
                            <Calendar size={20} /> Daftar Hari Libur
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700/50">
                                        <th className="p-3 font-semibold dark:text-gray-300">Tanggal</th>
                                        <th className="p-3 font-semibold dark:text-gray-300">Keterangan</th>
                                        <th className="p-3 font-semibold text-center dark:text-gray-300">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="3" className="p-4 text-center dark:text-gray-400">Memuat...</td></tr>
                                    ) : holidays.length === 0 ? (
                                        <tr><td colSpan="3" className="p-4 text-center dark:text-gray-400">Belum ada data hari libur.</td></tr>
                                    ) : (
                                        holidays.map(h => (
                                            <tr key={h.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="p-3 dark:text-gray-300">{h.date}</td>
                                                <td className="p-3 dark:text-gray-300">{h.description}</td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => handleDelete(h.id)} className="text-red-500 hover:text-red-700 p-1">
                                                        <Trash2 size={18} />
                                                    </button>
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
        </AuthenticatedLayout>
    );
}
