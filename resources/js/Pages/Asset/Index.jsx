import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Laptop, Trash2, Edit, PlusCircle } from 'lucide-react';

export default function AssetIndex({ auth }) {
    const [assets, setAssets] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const isEmployee = auth.user.role === 'employee';

    const [form, setForm] = useState({
        id: null,
        name: '',
        type: 'laptop',
        serial_number: '',
        status: 'available',
        employee_id: '',
        notes: ''
    });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchAssets();
        if (!isEmployee) {
            fetchEmployees();
        }
    }, []);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/assets');
            setAssets(response.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await axios.get('/api/v1/employees');
            setEmployees(response.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const submitForm = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axios.put(`/api/v1/assets/${form.id}`, form);
                alert('Aset berhasil diubah!');
            } else {
                await axios.post('/api/v1/assets', form);
                alert('Aset berhasil ditambahkan!');
            }
            resetForm();
            fetchAssets();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Gagal menyimpan aset.');
        }
    };

    const deleteAsset = async (id) => {
        if (!confirm('Anda yakin ingin menghapus aset ini?')) return;
        try {
            await axios.delete(`/api/v1/assets/${id}`);
            fetchAssets();
        } catch (error) {
            console.error(error);
            alert('Gagal menghapus aset.');
        }
    };

    const handleEdit = (asset) => {
        setIsEditing(true);
        setForm({
            id: asset.id,
            name: asset.name,
            type: asset.type || 'laptop',
            serial_number: asset.serial_number || '',
            status: asset.status,
            employee_id: asset.employee_id || '',
            notes: asset.notes || ''
        });
    };

    const resetForm = () => {
        setIsEditing(false);
        setForm({
            id: null,
            name: '',
            type: 'laptop',
            serial_number: '',
            status: 'available',
            employee_id: '',
            notes: ''
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Manajemen Aset</h2>}
        >
            <Head title="Manajemen Aset" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {!isEmployee && (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                                {isEditing ? <Edit size={20}/> : <PlusCircle size={20} />} 
                                {isEditing ? 'Ubah Data Aset' : 'Tambah Aset Baru'}
                            </h3>
                            <form onSubmit={submitForm} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Aset / Merk</label>
                                        <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jenis Aset</label>
                                        <select required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                                            <option value="laptop">Laptop / PC</option>
                                            <option value="monitor">Monitor</option>
                                            <option value="phone">Handphone</option>
                                            <option value="vehicle">Kendaraan Dinas</option>
                                            <option value="other">Lainnya</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Serial Number / Plat</label>
                                        <input type="text" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.serial_number} onChange={e => setForm({...form, serial_number: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                        <select required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                                            <option value="available">Tersedia (Available)</option>
                                            <option value="borrowed">Dipinjam (Borrowed)</option>
                                            <option value="broken">Rusak (Broken)</option>
                                        </select>
                                    </div>
                                    {form.status === 'borrowed' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dipinjam Oleh (Karyawan)</label>
                                            <select required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm" value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})}>
                                                <option value="">Pilih Karyawan</option>
                                                {employees.map(emp => (
                                                    <option key={emp.id} value={emp.id}>{emp.user?.name} ({emp.employee_code})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
                                        {isEditing ? 'Simpan Perubahan' : 'Tambah Aset'}
                                    </button>
                                    {isEditing && (
                                        <button type="button" onClick={resetForm} className="bg-gray-400 text-white px-4 py-2 rounded shadow hover:bg-gray-500">
                                            Batal
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                            <Laptop size={20} /> {isEmployee ? 'Aset Yang Saya Pinjam' : 'Daftar Seluruh Aset'}
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Nama Aset</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Jenis / S.N</th>
                                        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                        {!isEmployee && <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Peminjam</th>}
                                        {!isEmployee && <th className="p-4 font-semibold text-gray-700 dark:text-gray-300 text-center">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" className="p-4 text-center dark:text-gray-400">Memuat data...</td></tr>
                                    ) : assets.length === 0 ? (
                                        <tr><td colSpan="5" className="p-4 text-center dark:text-gray-400">{isEmployee ? 'Anda tidak meminjam aset apapun.' : 'Belum ada data aset.'}</td></tr>
                                    ) : (
                                        assets.map(asset => (
                                            <tr key={asset.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="p-4 font-medium text-gray-800 dark:text-gray-200">{asset.name}</td>
                                                <td className="p-4 dark:text-gray-300">
                                                    <span className="uppercase text-xs font-bold text-gray-500 mr-2">{asset.type}</span>
                                                    {asset.serial_number}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                        asset.status === 'available' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' :
                                                        asset.status === 'borrowed' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' : 
                                                        'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                                                    }`}>
                                                        {asset.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                {!isEmployee && (
                                                    <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                                                        {asset.employee ? asset.employee.user?.name : '-'}
                                                    </td>
                                                )}
                                                {!isEmployee && (
                                                    <td className="p-4 text-center space-x-2">
                                                        <button onClick={() => handleEdit(asset)} className="text-blue-600 hover:text-blue-800"><Edit size={16}/></button>
                                                        <button onClick={() => deleteAsset(asset.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
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
        </AuthenticatedLayout>
    );
}
