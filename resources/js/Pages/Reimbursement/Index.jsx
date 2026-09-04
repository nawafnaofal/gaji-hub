import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { DollarSign, CheckCircle, XCircle, FileText, Eye } from 'lucide-react';

export default function ReimbursementIndex({ auth }) {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [form, setForm] = useState({
        date: '',
        amount: '',
        description: '',
        attachment: null
    });

    const isEmployee = auth.user.role === 'employee';

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/reimbursements');
            setClaims(response.data.data);
        } catch (error) {
            console.error("Error fetching reimbursements", error);
        } finally {
            setLoading(false);
        }
    };

    const submitClaim = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('date', form.date);
        formData.append('amount', form.amount);
        formData.append('description', form.description);
        if (form.attachment) {
            formData.append('attachment', form.attachment);
        }

        try {
            await axios.post('/api/v1/reimbursements', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Klaim berhasil diajukan!');
            setForm({ date: '', amount: '', description: '', attachment: null });
            fetchClaims();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Gagal mengajukan klaim.');
        }
    };

    const updateStatus = async (id, status) => {
        if (!confirm(`Anda yakin ingin memproses ini?`)) return;
        try {
            await axios.put(`/api/v1/reimbursements/${id}`, { status });
            fetchClaims();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Gagal mengupdate status.');
        }
    };

    const canApprove = (claim) => {
        if (isEmployee) return false;
        return claim.status === 'pending_hr' || claim.status === 'pending' || claim.status === 'pending_manager';
    };

    const showActionColumn = !isEmployee;

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Reimbursement (Klaim)</h2>}
        >
            <Head title="Reimbursement" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {isEmployee && (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                                <DollarSign size={20} /> Form Pengajuan Klaim
                            </h3>
                            <form onSubmit={submitClaim} className="space-y-4 max-w-2xl">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Pengeluaran</label>
                                        <input type="date" required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nominal (Rp)</label>
                                        <input type="number" required min="1" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" placeholder="Contoh: 150000" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Keterangan / Deskripsi</label>
                                    <textarea required rows="3" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" placeholder="Misal: Biaya transport ke lokasi klien X" value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lampiran (Struk / Nota)</label>
                                    <input type="file" accept="image/*,.pdf" className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/50 dark:file:text-blue-300" onChange={e => setForm({...form, attachment: e.target.files[0]})} />
                                </div>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Ajukan Klaim</button>
                            </form>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Riwayat Reimbursement</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                        {!isEmployee || claims.some(c => c.employee?.user_id !== auth.user.id) ? (
                                            <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Karyawan</th>
                                        ) : null}
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Keterangan</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Nominal</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Lampiran</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                        {showActionColumn && <th className="p-4 font-semibold text-gray-700 dark:text-gray-300 text-center">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="6" className="p-4 text-center dark:text-gray-400">Memuat data...</td></tr>
                                    ) : claims.length === 0 ? (
                                        <tr><td colSpan="6" className="p-4 text-center dark:text-gray-400">Belum ada pengajuan klaim.</td></tr>
                                    ) : (
                                        claims.map(claim => (
                                            <tr key={claim.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                {(!isEmployee || claims.some(c => c.employee?.user_id !== auth.user.id)) && (
                                                    <td className="p-4">
                                                        <div className="font-medium text-gray-800 dark:text-gray-200">{claim.employee?.user?.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{claim.employee?.employee_code}</div>
                                                    </td>
                                                )}
                                                <td className="p-4 whitespace-nowrap dark:text-gray-300">{claim.date}</td>
                                                <td className="p-4 text-gray-600 dark:text-gray-400">{claim.description}</td>
                                                <td className="p-4 font-medium dark:text-gray-200">{formatRupiah(claim.amount)}</td>
                                                <td className="p-4">
                                                    {claim.attachment_url ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewUrl(claim.attachment_url)} 
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
                                                        claim.status === 'approved' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' :
                                                        claim.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400' : 
                                                        'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
                                                    }`}>
                                                        {claim.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                {showActionColumn && (
                                                    <td className="p-4 text-center space-x-2">
                                                        {canApprove(claim) && (
                                                            <>
                                                                <button onClick={() => updateStatus(claim.id, isEmployee ? 'pending_hr' : 'approved')} className="text-green-600 hover:text-green-800" title="Setujui"><CheckCircle size={20}/></button>
                                                                <button onClick={() => updateStatus(claim.id, 'rejected')} className="text-red-600 hover:text-red-800" title="Tolak"><XCircle size={20}/></button>
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
                    </div>
                </div>
            </div>

            {/* Modal Quick Preview Bukti Lampiran */}
            {previewUrl && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-5 overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center pb-3 border-b dark:border-gray-700">
                            <h4 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                                <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                                Bukti Struk / Nota Pembayaran
                            </h4>
                            <button onClick={() => setPreviewUrl(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold">&times;</button>
                        </div>
                        <div className="my-4 max-h-[65vh] flex items-center justify-center overflow-auto rounded-xl bg-gray-100 dark:bg-gray-900 p-2">
                            {previewUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i) || previewUrl.startsWith('data:image') || !previewUrl.endsWith('.pdf') ? (
                                <img src={previewUrl} alt="Bukti Struk" className="max-h-[60vh] object-contain rounded-lg shadow-sm" />
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
