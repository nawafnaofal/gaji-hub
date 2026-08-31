import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Target, TrendingUp, Plus, CheckCircle, Flag } from 'lucide-react';

export default function OkrManagement({ auth }) {
    const [objectives, setObjectives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showObjModal, setShowObjModal] = useState(false);
    const [showKrModal, setShowKrModal] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [selectedObjId, setSelectedObjId] = useState(null);
    const [selectedKr, setSelectedKr] = useState(null);

    const [newObj, setNewObj] = useState({ title: '', start_date: '', end_date: '', employee_id: auth.user.employee?.id || '' });
    const [newKr, setNewKr] = useState({ title: '', target_value: '', unit: '%' });
    const [progressVal, setProgressVal] = useState({ current_value: '', notes: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get('/api/v1/okr');
            setObjectives(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateObj = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/v1/okr', newObj);
            setShowObjModal(false);
            setNewObj({ ...newObj, title: '', start_date: '', end_date: '' });
            fetchData();
        } catch (e) {
            alert('Gagal membuat Objective');
        }
    };

    const handleCreateKr = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/v1/okr/key-results', { ...newKr, objective_id: selectedObjId });
            setShowKrModal(false);
            setNewKr({ title: '', target_value: '', unit: '%' });
            fetchData();
        } catch (e) {
            alert('Gagal membuat Key Result');
        }
    };

    const handleUpdateProgress = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/v1/okr/key-results/${selectedKr.id}/progress`, progressVal);
            setShowProgressModal(false);
            setProgressVal({ current_value: '', notes: '' });
            fetchData();
        } catch (e) {
            alert('Gagal update progress');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'on_track': return 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400';
            case 'at_risk': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'off_track': return 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400';
            case 'completed': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Manajemen OKR</h2>}
        >
            <Head title="OKR" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Target className="text-blue-600" /> Objectives & Key Results
                        </h3>
                        <button onClick={() => setShowObjModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
                            <Plus size={18} /> Buat Objective Baru
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {objectives.map(obj => (
                                <div key={obj.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                                        <div>
                                            <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
                                                <Flag size={20} className="text-gray-400" /> {obj.title}
                                            </h4>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span>Periode: {obj.start_date} - {obj.end_date}</span>
                                                {obj.employee && <span>• Karyawan: {obj.employee.name}</span>}
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(obj.status)}`}>
                                            {obj.status.replace('_', ' ')}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h5 className="font-bold text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wider">Key Results</h5>
                                            <button onClick={() => { setSelectedObjId(obj.id); setShowKrModal(true); }} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                                <Plus size={14} /> Tambah KR
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {obj.key_results?.map(kr => {
                                                const pct = kr.target_value > 0 ? Math.min(100, Math.round((kr.current_value / kr.target_value) * 100)) : 0;
                                                return (
                                                    <div key={kr.id} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-col">
                                                        <div className="flex justify-between mb-2">
                                                            <span className="font-medium">{kr.title}</span>
                                                            <button 
                                                                onClick={() => { setSelectedKr(kr); setProgressVal({ current_value: kr.current_value, notes: '' }); setShowProgressModal(true); }} 
                                                                className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-200"
                                                            >
                                                                Update
                                                            </button>
                                                        </div>
                                                        <div className="flex justify-between text-sm text-gray-500 mb-1">
                                                            <span>{kr.current_value} {kr.unit}</span>
                                                            <span>{kr.target_value} {kr.unit}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                                                        </div>
                                                        <div className="text-right text-xs text-blue-600 mt-1 font-bold">{pct}%</div>
                                                    </div>
                                                );
                                            })}
                                            {(!obj.key_results || obj.key_results.length === 0) && (
                                                <div className="col-span-full text-center text-sm text-gray-500 py-4">Belum ada Key Result.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {objectives.length === 0 && (
                                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-gray-500">
                                    Belum ada OKR yang dibuat.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Objective */}
            {showObjModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Buat Objective</h3>
                        <form onSubmit={handleCreateObj} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input required type="text" value={newObj.title} onChange={e => setNewObj({...newObj, title: e.target.value})} className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Mulai</label>
                                    <input required type="date" value={newObj.start_date} onChange={e => setNewObj({...newObj, start_date: e.target.value})} className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Selesai</label>
                                    <input required type="date" value={newObj.end_date} onChange={e => setNewObj({...newObj, end_date: e.target.value})} className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900" />
                                </div>
                            </div>
                            {auth.user.hasRole?.['admin'] && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Employee ID</label>
                                    <input type="number" value={newObj.employee_id} onChange={e => setNewObj({...newObj, employee_id: e.target.value})} className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900" />
                                </div>
                            )}
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowObjModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Key Result */}
            {showKrModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Tambah Key Result</h3>
                        <form onSubmit={handleCreateKr} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Indikator / Title</label>
                                <input required type="text" value={newKr.title} onChange={e => setNewKr({...newKr, title: e.target.value})} className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Target Value</label>
                                    <input required type="number" value={newKr.target_value} onChange={e => setNewKr({...newKr, target_value: e.target.value})} className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Satuan (Unit)</label>
                                    <input required type="text" value={newKr.unit} onChange={e => setNewKr({...newKr, unit: e.target.value})} className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900" placeholder="%, IDR, pcs" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowKrModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Progress */}
            {showProgressModal && selectedKr && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Update Progress: {selectedKr.title}</h3>
                        <form onSubmit={handleUpdateProgress} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Current Value ({selectedKr.unit})</label>
                                <input required type="number" max={selectedKr.target_value} value={progressVal.current_value} onChange={e => setProgressVal({...progressVal, current_value: e.target.value})} className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Catatan</label>
                                <textarea value={progressVal.notes} onChange={e => setProgressVal({...progressVal, notes: e.target.value})} className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900" rows="3"></textarea>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowProgressModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
