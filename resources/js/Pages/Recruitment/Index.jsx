import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Briefcase, Users, Plus, CheckCircle, XCircle } from 'lucide-react';

export default function Recruitment({ auth }) {
    const [positions, setPositions] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewPositionModal, setShowNewPositionModal] = useState(false);
    const [newPosition, setNewPosition] = useState({ title: '', department: '', status: 'open', type: 'Full-time' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [posRes, appRes] = await Promise.all([
                axios.get('/api/v1/recruitment/positions'),
                axios.get('/api/v1/recruitment/applications')
            ]);
            setPositions(posRes.data.data);
            setApplications(appRes.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePosition = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/v1/recruitment/positions', newPosition);
            setShowNewPositionModal(false);
            setNewPosition({ title: '', department: '', status: 'open', type: 'Full-time' });
            fetchData();
        } catch (error) {
            alert('Gagal menambahkan posisi');
        }
    };

    const updateAppStatus = async (id, status) => {
        try {
            await axios.put(`/api/v1/recruitment/applications/${id}/status`, { status });
            fetchData();
        } catch (error) {
            alert('Gagal update status');
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Recruitment & ATS</h2>}
        >
            <Head title="Recruitment" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Papan Lamaran (ATS)</h3>
                        <button onClick={() => setShowNewPositionModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
                            <Plus size={18} /> Buka Lowongan Baru
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {['applied', 'reviewed', 'interviewed', 'hired'].map(status => (
                                <div key={status} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 flex flex-col max-h-[80vh]">
                                    <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-4 capitalize flex justify-between items-center">
                                        {status}
                                        <span className="bg-white dark:bg-gray-700 text-sm px-2 py-0.5 rounded-full shadow-sm">
                                            {applications.filter(a => a.status === status).length}
                                        </span>
                                    </h4>
                                    
                                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                                        {applications.filter(a => a.status === status).map(app => (
                                            <div key={app.id} className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 space-y-2.5">
                                                <div>
                                                    <h5 className="font-bold text-sm text-gray-900 dark:text-white">{app.candidate?.name}</h5>
                                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{app.job_position?.title}</p>
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-gray-300 space-y-0.5 border-t dark:border-gray-600 pt-2">
                                                    <p className="truncate">✉️ {app.candidate?.email || '-'}</p>
                                                    {app.candidate?.phone && <p>📞 {app.candidate?.phone}</p>}
                                                </div>
                                                {app.candidate?.resume_path && (
                                                    <a 
                                                        href={`/storage/${app.candidate.resume_path}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
                                                    >
                                                        📄 Lihat Resume / CV
                                                    </a>
                                                )}
                                                <div className="flex gap-2 pt-1">
                                                    <select 
                                                        value={app.status}
                                                        onChange={(e) => updateAppStatus(app.id, e.target.value)}
                                                        className="text-xs rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 py-1.5 flex-1 font-medium"
                                                    >
                                                        <option value="applied">Applied</option>
                                                        <option value="reviewed">Reviewed</option>
                                                        <option value="interviewed">Interviewed</option>
                                                        <option value="offered">Offered</option>
                                                        <option value="hired">Hired</option>
                                                        <option value="rejected">Rejected</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Tambah Posisi */}
            {showNewPositionModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Lowongan Baru</h3>
                        <form onSubmit={handleCreatePosition} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Judul Pekerjaan</label>
                                <input required type="text" value={newPosition.title} onChange={e => setNewPosition({...newPosition, title: e.target.value})} className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Departemen</label>
                                <input required type="text" value={newPosition.department} onChange={e => setNewPosition({...newPosition, department: e.target.value})} className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900" />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowNewPositionModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
