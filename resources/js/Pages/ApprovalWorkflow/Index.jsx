import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    Workflow, Plus, Trash2, Edit2, CheckCircle2, ArrowRight, 
    ShieldCheck, DollarSign, Layers, UserCheck, Settings, X, 
    Play, Sparkles, AlertCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ApprovalWorkflowIndex({ auth }) {
    const [workflows, setWorkflows] = useState([]);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [modules, setModules] = useState([]);
    const [selectedModule, setSelectedModule] = useState('leave');
    const [loading, setLoading] = useState(true);

    // Modal Builder State
    const [showModal, setShowModal] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        module: 'leave',
        name: '',
        min_amount: 0,
        max_amount: '',
        tiers: [
            { level: 1, role: 'direct_manager', label: 'Atasan Langsung (Manager)' },
            { level: 2, role: 'hr', label: 'HR Department' },
        ],
        is_active: true,
    });

    // Interactive Simulator State
    const [simAmount, setSimAmount] = useState(1500000);
    const [simResult, setSimResult] = useState(null);
    const [simulating, setSimulating] = useState(false);

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/v1/approval-workflows');
            if (res.data.success) {
                setWorkflows(res.data.data || []);
                setAvailableRoles(res.data.available_roles || []);
                setModules(res.data.modules || []);
            }
        } catch (err) {
            console.error(err);
            toast.error('Gagal memuat konfigurasi approval workflow.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingWorkflow(null);
        setForm({
            module: selectedModule,
            name: `Alur ${modules.find(m => m.id === selectedModule)?.label || 'Persetujuan'} Khusus`,
            min_amount: 0,
            max_amount: '',
            tiers: [
                { level: 1, role: 'direct_manager', label: 'Atasan Langsung' },
                { level: 2, role: 'hr', label: 'HR Admin' },
            ],
            is_active: true,
        });
        setShowModal(true);
    };

    const handleOpenEdit = (wf) => {
        setEditingWorkflow(wf);
        setForm({
            module: wf.module,
            name: wf.name,
            min_amount: wf.min_amount || 0,
            max_amount: wf.max_amount || '',
            tiers: Array.isArray(wf.tiers) ? wf.tiers : [],
            is_active: wf.is_active,
        });
        setShowModal(true);
    };

    const handleAddTier = () => {
        const nextLevel = form.tiers.length + 1;
        setForm({
            ...form,
            tiers: [
                ...form.tiers,
                { level: nextLevel, role: 'director', label: 'Direktur / Manajemen' }
            ]
        });
    };

    const handleRemoveTier = (idx) => {
        if (form.tiers.length <= 1) {
            toast.error('Minimal harus ada 1 level persetujuan.');
            return;
        }
        const updated = form.tiers.filter((_, i) => i !== idx).map((t, i) => ({ ...t, level: i + 1 }));
        setForm({ ...form, tiers: updated });
    };

    const handleTierChange = (idx, field, val) => {
        const updated = [...form.tiers];
        updated[idx][field] = val;
        if (field === 'role') {
            const roleObj = availableRoles.find(r => r.id === val);
            if (roleObj) updated[idx].label = roleObj.label;
        }
        setForm({ ...form, tiers: updated });
    };

    const handleSubmitWorkflow = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingWorkflow) {
                await axios.put(`/api/v1/approval-workflows/${editingWorkflow.id}`, form);
                toast.success('Alur persetujuan berhasil diperbarui!');
            } else {
                await axios.post('/api/v1/approval-workflows', form);
                toast.success('Alur persetujuan baru berhasil disimpan!');
            }
            setShowModal(false);
            fetchWorkflows();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Gagal menyimpan workflow.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus alur persetujuan ini?')) return;
        try {
            await axios.delete(`/api/v1/approval-workflows/${id}`);
            toast.success('Alur persetujuan dihapus.');
            fetchWorkflows();
        } catch (err) {
            console.error(err);
            toast.error('Gagal menghapus workflow.');
        }
    };

    const handleToggleActive = async (wf) => {
        try {
            await axios.put(`/api/v1/approval-workflows/${wf.id}`, { is_active: !wf.is_active });
            toast.success('Status aktif workflow diperbarui.');
            fetchWorkflows();
        } catch (err) {
            console.error(err);
            toast.error('Gagal mengubah status aktif.');
        }
    };

    const runSimulation = async () => {
        setSimulating(true);
        try {
            const res = await axios.post('/api/v1/approval-workflows/preview', {
                module: selectedModule,
                amount: simAmount,
            });
            if (res.data.success) {
                setSimResult(res.data.data);
            }
        } catch (err) {
            console.error(err);
            toast.error('Gagal menjalankan simulasi.');
        } finally {
            setSimulating(false);
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'direct_manager':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
            case 'department_head':
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
            case 'hr':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
            case 'finance':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
            case 'director':
                return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
        }
    };

    const filteredWorkflows = workflows.filter(w => w.module === selectedModule);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight flex items-center gap-2">
                            <Workflow className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            Multi-Tier Approval Workflow Builder
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Konfigurasi alur persetujuan bertingkat dinamis (Direct Manager ➔ HOD ➔ HR ➔ Finance ➔ Direktur) dengan batasan nominal fleksibel ala Mekari Talenta.
                        </p>
                    </div>

                    <button
                        onClick={handleOpenCreate}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                    >
                        <Plus size={16} /> Buat Alur Persetujuan Baru
                    </button>
                </div>
            }
        >
            <Head title="Workflow Persetujuan" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Module Tabs */}
                    <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-wrap gap-2">
                        {modules.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => {
                                    setSelectedModule(m.id);
                                    setSimResult(null);
                                }}
                                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                                    selectedModule === m.id
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-gray-50 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Layers size={14} />
                                <span>{m.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                    selectedModule === m.id ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }`}>
                                    {workflows.filter(w => w.module === m.id).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Workflows List */}
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">
                            <Loader2 size={28} className="animate-spin mx-auto mb-2 text-blue-600" />
                            Memuat alur persetujuan...
                        </div>
                    ) : filteredWorkflows.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-100 dark:border-gray-700">
                            <Workflow className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <h4 className="text-base font-bold text-gray-700 dark:text-gray-300">Belum Ada Workflow Kustom</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
                                Klik tombol &quot;Buat Alur Persetujuan Baru&quot; untuk mengatur tahapan approval khusus.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredWorkflows.map((wf) => (
                                <div 
                                    key={wf.id}
                                    className={`bg-white dark:bg-gray-800 rounded-xl border p-6 shadow-sm transition ${
                                        wf.is_active ? 'border-gray-100 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700/60 opacity-60'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-700 mb-5">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                                    {wf.name}
                                                </h3>
                                                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                                                    wf.is_active 
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                }`}>
                                                    {wf.is_active ? 'AKTIF' : 'NONAKTIF'}
                                                </span>
                                            </div>

                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
                                                {wf.max_amount ? (
                                                    <span>
                                                        Batas Nominal: <strong>Rp {new Intl.NumberFormat('id-ID').format(wf.min_amount)}</strong> s/d <strong>Rp {new Intl.NumberFormat('id-ID').format(wf.max_amount)}</strong>
                                                    </span>
                                                ) : (
                                                    <span>Berlaku untuk semua nominal pengajuan</span>
                                                )}
                                                <span>•</span>
                                                <span>Total {wf.tiers?.length || 0} Tingkat Approval</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleActive(wf)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                                                    wf.is_active 
                                                        ? 'border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300' 
                                                        : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30'
                                                }`}
                                            >
                                                {wf.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                            </button>

                                            <button
                                                onClick={() => handleOpenEdit(wf)}
                                                className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
                                                title="Edit Workflow"
                                            >
                                                <Edit2 size={15} />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(wf.id)}
                                                className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-400 hover:text-rose-600 transition"
                                                title="Hapus"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Visual Pipeline Nodes */}
                                    <div className="py-3 overflow-x-auto">
                                        <div className="flex items-center gap-2 min-w-max">
                                            {/* Start Node */}
                                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-300">
                                                <UserCheck size={16} className="text-gray-500" />
                                                <span>Karyawan Mengajukan</span>
                                            </div>

                                            <ArrowRight size={16} className="text-gray-400 shrink-0" />

                                            {/* Intermediate Tiers */}
                                            {wf.tiers?.map((t, idx) => (
                                                <React.Fragment key={idx}>
                                                    <div className={`flex flex-col px-4 py-2.5 rounded-xl border text-xs shadow-sm ${getRoleColor(t.role)}`}>
                                                        <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-70">
                                                            Level {t.level} Approval
                                                        </span>
                                                        <span className="font-bold text-sm mt-0.5">
                                                            {t.label}
                                                        </span>
                                                    </div>

                                                    <ArrowRight size={16} className="text-gray-400 shrink-0" />
                                                </React.Fragment>
                                            ))}

                                            {/* End Node */}
                                            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                                <CheckCircle2 size={16} className="text-emerald-600" />
                                                <span>Disetujui Sepenuhnya (Approved)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Interactive Simulator Card */}
                    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-xl p-6 border border-blue-100 dark:border-gray-700">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-200/60 dark:border-gray-700 mb-4">
                            <div>
                                <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-600" />
                                    Simulator Alur Approval Otomatis
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Uji alur persetujuan mana yang akan aktif saat karyawan melakukan pengajuan pada modul {modules.find(m => m.id === selectedModule)?.label}.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {['reimbursement', 'cash_advance'].includes(selectedModule) && (
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-xs text-gray-400">Rp</span>
                                        <input
                                            type="number"
                                            value={simAmount}
                                            onChange={e => setSimAmount(Number(e.target.value))}
                                            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 w-36"
                                            placeholder="Nominal"
                                        />
                                    </div>
                                )}

                                <button
                                    onClick={runSimulation}
                                    disabled={simulating}
                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                                >
                                    {simulating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                                    Jalankan Simulasi
                                </button>
                            </div>
                        </div>

                        {simResult ? (
                            <div className="bg-white/90 dark:bg-gray-750 p-4 rounded-xl border border-blue-200/50 dark:border-gray-600">
                                <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Alur Terpilih: <strong className="text-indigo-600 dark:text-indigo-400">{simResult.name}</strong>
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto py-1">
                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold">
                                        Pengajuan Baru
                                    </span>
                                    {simResult.tiers?.map((t, idx) => (
                                        <React.Fragment key={idx}>
                                            <ArrowRight size={14} className="text-gray-400" />
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getRoleColor(t.role)}`}>
                                                Level {t.level}: {t.label}
                                            </span>
                                        </React.Fragment>
                                    ))}
                                    <ArrowRight size={14} className="text-gray-400" />
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 rounded-lg text-xs font-bold">
                                        Approved
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                Klik &quot;Jalankan Simulasi&quot; untuk melihat jalur persetujuan yang dievaluasi sistem.
                            </p>
                        )}
                    </div>

                </div>
            </div>

            {/* MODAL WORKFLOW BUILDER */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 mb-4">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Workflow className="w-5 h-5 text-blue-600" />
                                {editingWorkflow ? 'Edit Alur Persetujuan' : 'Buat Alur Persetujuan Baru'}
                            </h4>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitWorkflow} className="space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                    Nama Alur Persetujuan
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Alur Reimbursement Direksi (> 5 Juta)"
                                    value={form.name}
                                    onChange={e => setForm({...form, name: e.target.value})}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        Modul
                                    </label>
                                    <select
                                        value={form.module}
                                        onChange={e => setForm({...form, module: e.target.value})}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 text-sm"
                                    >
                                        {modules.map(m => (
                                            <option key={m.id} value={m.id}>{m.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        Status Aktif
                                    </label>
                                    <select
                                        value={form.is_active ? '1' : '0'}
                                        onChange={e => setForm({...form, is_active: e.target.value === '1'})}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 text-sm"
                                    >
                                        <option value="1">Aktif</option>
                                        <option value="0">Nonaktif</option>
                                    </select>
                                </div>
                            </div>

                            {['reimbursement', 'cash_advance'].includes(form.module) && (
                                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                                            Nominal Minimal (Rp)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.min_amount}
                                            onChange={e => setForm({...form, min_amount: Number(e.target.value)})}
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                                            Nominal Maksimal (Opsional)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="Tanpa batas"
                                            value={form.max_amount}
                                            onChange={e => setForm({...form, max_amount: e.target.value ? Number(e.target.value) : ''})}
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 text-xs"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Tiers List */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Tahapan Level Persetujuan
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddTier}
                                        className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Tambah Level
                                    </button>
                                </div>

                                <div className="space-y-2.5">
                                    {form.tiers.map((tier, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                                            <span className="w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs font-bold shrink-0">
                                                {tier.level}
                                            </span>

                                            <div className="flex-1 grid grid-cols-2 gap-2">
                                                <select
                                                    value={tier.role}
                                                    onChange={e => handleTierChange(idx, 'role', e.target.value)}
                                                    className="text-xs rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                                                >
                                                    {availableRoles.map(r => (
                                                        <option key={r.id} value={r.id}>{r.label}</option>
                                                    ))}
                                                </select>

                                                <input
                                                    type="text"
                                                    value={tier.label}
                                                    onChange={e => handleTierChange(idx, 'label', e.target.value)}
                                                    placeholder="Label Level"
                                                    className="text-xs rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTier(idx)}
                                                className="text-gray-400 hover:text-rose-600 p-1"
                                                title="Hapus Level"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow flex items-center gap-1.5"
                                >
                                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                    Simpan Alur Persetujuan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
