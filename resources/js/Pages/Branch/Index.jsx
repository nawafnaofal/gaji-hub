import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { 
    Building2, MapPin, Plus, Search, Edit2, Trash2, Users, 
    Navigation, ShieldCheck, CheckCircle2, AlertCircle, 
    Compass, Radio, ExternalLink, X, Save, RefreshCw
} from 'lucide-react';

export default function BranchIndex({ auth }) {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [employees, setEmployees] = useState([]);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        latitude: -6.1515954,
        longitude: 106.7765215,
        radius_meters: 100,
        is_head_office: false,
        is_active: true,
    });

    // Assign state
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/v1/branches');
            if (res.data.success) {
                setBranches(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch branches:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get('/api/v1/employees');
            if (res.data.success) {
                setEmployees(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch employees:', err);
        }
    };

    useEffect(() => {
        fetchBranches();
        fetchEmployees();
    }, []);

    const openCreateModal = () => {
        setSelectedBranch(null);
        setFormData({
            name: '',
            code: '',
            address: '',
            latitude: -6.1515954,
            longitude: 106.7765215,
            radius_meters: 100,
            is_head_office: branches.length === 0,
            is_active: true,
        });
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const openEditModal = (branch) => {
        setSelectedBranch(branch);
        setFormData({
            name: branch.name,
            code: branch.code,
            address: branch.address || '',
            latitude: branch.latitude,
            longitude: branch.longitude,
            radius_meters: branch.radius_meters,
            is_head_office: branch.is_head_office,
            is_active: branch.is_active,
        });
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const openAssignModal = async (branch) => {
        setSelectedBranch(branch);
        try {
            const res = await axios.get(`/api/v1/branches/${branch.id}`);
            if (res.data.success) {
                const assignedIds = (res.data.data.employees || []).map(e => e.id);
                setSelectedEmployeeIds(assignedIds);
            }
        } catch (e) {
            console.error(e);
        }
        setIsAssignModalOpen(true);
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation tidak didukung oleh browser Anda.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: parseFloat(pos.coords.latitude.toFixed(7)),
                    longitude: parseFloat(pos.coords.longitude.toFixed(7)),
                }));
            },
            (err) => {
                alert('Gagal mengambil GPS: ' + err.message);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg('');

        try {
            if (selectedBranch) {
                await axios.put(`/api/v1/branches/${selectedBranch.id}`, formData);
                setSuccessMsg('Cabang kantor berhasil diperbarui!');
            } else {
                await axios.post('/api/v1/branches', formData);
                setSuccessMsg('Cabang kantor baru berhasil ditambahkan!');
            }
            setIsModalOpen(false);
            fetchBranches();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan cabang.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteBranch = async (branch) => {
        if (branch.is_head_office) {
            alert('Kantor Pusat tidak dapat dihapus.');
            return;
        }

        if (!confirm(`Hapus cabang "${branch.name}"? Karyawan yang terdaftar di cabang ini akan dialihkan ke status tanpa cabang.`)) {
            return;
        }

        try {
            await axios.delete(`/api/v1/branches/${branch.id}`);
            setSuccessMsg('Cabang berhasil dihapus.');
            fetchBranches();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menghapus cabang.');
        }
    };

    const handleSaveAssignments = async () => {
        if (!selectedBranch) return;
        setSubmitting(true);
        try {
            await axios.post(`/api/v1/branches/${selectedBranch.id}/assign`, {
                employee_ids: selectedEmployeeIds,
            });
            setSuccessMsg(`Karyawan berhasil dialokasikan ke cabang ${selectedBranch.name}!`);
            setIsAssignModalOpen(false);
            fetchBranches();
            fetchEmployees();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyimpan penugasan karyawan.');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredBranches = branches.filter(b => 
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.code.toLowerCase().includes(search.toLowerCase()) ||
        (b.address && b.address.toLowerCase().includes(search.toLowerCase()))
    );

    const totalEmployeesAssigned = branches.reduce((acc, b) => acc + (b.employees_count || 0), 0);
    const headOffice = branches.find(b => b.is_head_office);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Building2 className="w-7 h-7 text-blue-600" />
                            Multi-Cabang & Lokasi Kantor
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Kelola kantor cabang, lokasi geofencing GPS radius presisi, dan penugasan lokasi karyawan ala Mekari Talenta.
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
                    >
                        <Plus size={18} />
                        Tambah Cabang Baru
                    </button>
                </div>
            }
        >
            <Head title="Manajemen Multi-Cabang" />

            <div className="py-6 max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
                {/* Alert Notification */}
                {successMsg && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
                        <CheckCircle2 size={20} className="shrink-0" />
                        <p className="text-sm font-medium">{successMsg}</p>
                    </div>
                )}

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Cabang</p>
                                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{branches.length}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                                <Building2 size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Kantor Pusat (HQ)</p>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1 truncate max-w-[180px]">
                                    {headOffice ? headOffice.name : '-'}
                                </h3>
                            </div>
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                                <ShieldCheck size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Karyawan Teralokasi</p>
                                <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{totalEmployeesAssigned}</h3>
                            </div>
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                <Users size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Presisi Geofencing</p>
                                <h3 className="text-2xl font-extrabold text-amber-500 mt-1">GPS Radar</h3>
                            </div>
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-xl">
                                <Radio size={24} className="animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama cabang, kode, atau alamat..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={fetchBranches}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Muat Ulang
                    </button>
                </div>

                {/* Branch Cards Grid */}
                {loading ? (
                    <div className="py-20 text-center text-gray-400">
                        <RefreshCw size={32} className="mx-auto animate-spin mb-3 text-blue-500" />
                        <p className="text-sm">Memuat daftar cabang kantor...</p>
                    </div>
                ) : filteredBranches.length === 0 ? (
                    <div className="py-16 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                        <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <h4 className="text-base font-semibold text-gray-700 dark:text-gray-200">Belum ada kantor cabang</h4>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                            Klik tombol "Tambah Cabang Baru" untuk mendaftarkan titik lokasi kantor dan radius absensi.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredBranches.map((branch) => (
                            <div
                                key={branch.id}
                                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                            >
                                <div>
                                    {/* Header card */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                                    {branch.name}
                                                </h3>
                                            </div>
                                            <span className="inline-block mt-1 font-mono text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md font-semibold">
                                                {branch.code}
                                            </span>
                                        </div>

                                        <div className="flex flex-col items-end gap-1.5">
                                            {branch.is_head_office ? (
                                                <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 flex items-center gap-1">
                                                    <ShieldCheck size={12} />
                                                    Head Office
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                    Cabang
                                                </span>
                                            )}

                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                branch.is_active 
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                                {branch.is_active ? 'Aktif' : 'Non-aktif'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5 mb-4 line-clamp-2">
                                        <MapPin size={14} className="shrink-0 mt-0.5 text-rose-500" />
                                        <span>{branch.address || 'Alamat belum diatur'}</span>
                                    </p>

                                    {/* Geofence & Coordinates info */}
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-2 mb-4 text-xs">
                                        <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                                            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                                <Radio size={14} className="text-amber-500" />
                                                Radius Absen:
                                            </span>
                                            <span className="font-bold text-gray-900 dark:text-white">
                                                {branch.radius_meters} meter
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-gray-600 dark:text-gray-300 font-mono text-[11px]">
                                            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                                <Compass size={14} className="text-blue-500" />
                                                Koordinat:
                                            </span>
                                            <a 
                                                href={`https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                                title="Buka di Google Maps"
                                            >
                                                {branch.latitude.toFixed(5)}, {branch.longitude.toFixed(5)}
                                                <ExternalLink size={10} />
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom actions */}
                                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <button
                                        onClick={() => openAssignModal(branch)}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
                                    >
                                        <Users size={14} />
                                        <span>{branch.employees_count || 0} Karyawan</span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openEditModal(branch)}
                                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                                            title="Ubah Cabang"
                                        >
                                            <Edit2 size={15} />
                                        </button>
                                        {!branch.is_head_office && (
                                            <button
                                                onClick={() => handleDeleteBranch(branch)}
                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                                                title="Hapus Cabang"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Tambah / Edit Cabang */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                {selectedBranch ? 'Ubah Informasi Cabang' : 'Tambah Cabang Kantor Baru'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                            {errorMsg && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 text-xs rounded-xl flex items-center gap-2">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Nama Cabang Kantor *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="cth. Cabang Surabaya Gubeng"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Kode Cabang *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="cth. SBY-01"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full uppercase font-mono px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Radius Geofencing (Meter) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="10"
                                        max="50000"
                                        value={formData.radius_meters}
                                        onChange={(e) => setFormData({ ...formData, radius_meters: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Alamat Lengkap
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Jalan, Kelurahan, Kecamatan, Kota..."
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                                />
                            </div>

                            {/* Coordinates section with Quick GPS Button */}
                            <div className="p-3.5 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                                        <Navigation size={14} className="text-blue-600" />
                                        Koordinat GPS Lokasi Kantor
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleGetCurrentLocation}
                                        className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:underline bg-white dark:bg-gray-800 px-2.5 py-1 rounded-lg shadow-xs border border-blue-200 dark:border-blue-700 flex items-center gap-1"
                                    >
                                        <Radio size={12} className="text-emerald-500 animate-ping" />
                                        Ambil GPS Saya
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Latitude</label>
                                        <input
                                            type="number"
                                            step="0.0000001"
                                            required
                                            value={formData.latitude}
                                            onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                                            className="w-full font-mono text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Longitude</label>
                                        <input
                                            type="number"
                                            step="0.0000001"
                                            required
                                            value={formData.longitude}
                                            onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                                            className="w-full font-mono text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-2 pt-1">
                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_head_office}
                                        onChange={(e) => setFormData({ ...formData, is_head_office: e.target.checked })}
                                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                    />
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                        Jadikan sebagai Kantor Pusat (Head Office)
                                    </span>
                                </label>

                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                        Status Cabang Aktif
                                    </span>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                    <Save size={14} />
                                    {submitting ? 'Menyimpan...' : 'Simpan Cabang'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Alokasi Karyawan */}
            {isAssignModalOpen && selectedBranch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    Alokasi Karyawan ke {selectedBranch.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Pilih karyawan yang ditugaskan bekerja di lokasi cabang ini.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAssignModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-2">
                            {employees.map((emp) => {
                                const isChecked = selectedEmployeeIds.includes(emp.id);
                                return (
                                    <label
                                        key={emp.id}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                                            isChecked 
                                                ? 'bg-blue-50/60 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                                                : 'bg-white dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedEmployeeIds([...selectedEmployeeIds, emp.id]);
                                                    } else {
                                                        setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== emp.id));
                                                    }
                                                }}
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                    {emp.user?.name || 'Tanpa Nama'}
                                                </p>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                                    {emp.job_title || emp.position || '-'} • {emp.department_id || '-'}
                                                </p>
                                            </div>
                                        </div>

                                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                            {emp.employee_code}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                {selectedEmployeeIds.length} karyawan dipilih
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAssignModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700 rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveAssignments}
                                    disabled={submitting}
                                    className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Save size={14} />
                                    {submitting ? 'Menyimpan...' : 'Simpan Alokasi'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
