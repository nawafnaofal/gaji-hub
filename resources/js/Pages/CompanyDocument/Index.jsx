import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { FileText, Trash2, Download, PlusCircle } from 'lucide-react';

export default function CompanyDocumentIndex({ auth }) {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        title: '',
        description: '',
        type: 'policy',
        file: null
    });

    const isEmployee = auth.user.role === 'employee';

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/company-documents');
            setDocs(response.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const submitForm = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('type', form.type);
        if (form.file) formData.append('file', form.file);

        try {
            await axios.post('/api/v1/company-documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Dokumen berhasil diunggah!');
            setForm({ title: '', description: '', type: 'policy', file: null });
            fetchDocs();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Gagal mengunggah dokumen.');
        }
    };

    const deleteDoc = async (id) => {
        if (!confirm('Anda yakin ingin menghapus dokumen ini?')) return;
        try {
            await axios.delete(`/api/v1/company-documents/${id}`);
            fetchDocs();
        } catch (error) {
            console.error(error);
            alert('Gagal menghapus dokumen.');
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Dokumen Perusahaan</h2>}
        >
            <Head title="Dokumen Perusahaan" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {!isEmployee && (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                                <PlusCircle size={20} /> Unggah Dokumen Baru
                            </h3>
                            <form onSubmit={submitForm} className="space-y-4 max-w-2xl">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Judul Dokumen</label>
                                        <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipe Dokumen</label>
                                        <select required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                                            <option value="policy">Peraturan Perusahaan</option>
                                            <option value="sop">SOP / Panduan</option>
                                            <option value="guideline">Pedoman Karyawan</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deskripsi Singkat</label>
                                    <textarea rows="2" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">File Dokumen (PDF, Word)</label>
                                    <input type="file" required accept=".pdf,.doc,.docx" className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/50 dark:file:text-blue-300" onChange={e => setForm({...form, file: e.target.files[0]})} />
                                </div>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Upload Dokumen</button>
                            </form>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                            <FileText size={20} /> Daftar Dokumen & Kebijakan
                        </h3>
                        {loading ? (
                            <p className="text-gray-500 dark:text-gray-400">Memuat data...</p>
                        ) : docs.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">Belum ada dokumen perusahaan yang diunggah.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {docs.map(doc => (
                                    <div key={doc.id} className="border dark:border-gray-700 rounded-lg p-5 flex flex-col justify-between hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-700/50">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded uppercase">
                                                    {doc.type}
                                                </span>
                                                {!isEmployee && (
                                                    <button onClick={() => deleteDoc(doc.id)} className="text-red-500 hover:text-red-700">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-gray-800 dark:text-white text-lg mb-1">{doc.title}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">{doc.description}</p>
                                        </div>
                                        <div className="mt-4 pt-4 border-t dark:border-gray-600">
                                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                <Download size={16} /> Buka / Unduh Dokumen
                                            </a>
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
