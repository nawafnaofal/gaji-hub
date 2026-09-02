import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';

export default function Resignation({ auth }) {
    const [resignations, setResignations] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        employee_id: '',
        resign_date: '',
        reason: '',
        type: 'voluntary'
    });

    useEffect(() => {
        fetchData();
        fetchEmployees();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get('/api/v1/resignations');
            setResignations(res.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get('/api/v1/employees?limit=1000');
            setEmployees(res.data.data.data || res.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/v1/resignations', formData);
            setIsModalOpen(false);
            fetchData();
            setFormData({ employee_id: '', resign_date: '', reason: '', type: 'voluntary' });
            alert('Data offboarding berhasil disimpan & pesangon telah dikalkulasi.');
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal menyimpan data.');
        }
    };

    const handleApprove = async (id) => {
        if (!confirm('Setujui pesangon ini dan nonaktifkan karyawan?')) return;
        try {
            await axios.put(`/api/v1/resignations/${id}`, { status: 'approved' });
            fetchData();
            alert('Disetujui. Status karyawan menjadi Inactive.');
        } catch (error) {
            alert('Gagal memproses.');
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Offboarding & Pesangon (UU Cipta Kerja)</h2>}
        >
            <Head title="Offboarding" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Daftar Offboarding</h1>
                                <button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow transition"
                                >
                                    + Proses Offboarding Baru
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                            <th className="px-6 py-3">Nama Karyawan</th>
                                            <th className="px-6 py-3">Tgl Resign</th>
                                            <th className="px-6 py-3">Jenis</th>
                                            <th className="px-6 py-3">U. Pesangon</th>
                                            <th className="px-6 py-3">UPMK</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resignations.map(res => (
                                            <tr key={res.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                    {res.employee?.user?.name}
                                                </td>
                                                <td className="px-6 py-4">{res.resign_date}</td>
                                                <td className="px-6 py-4">{res.type === 'voluntary' ? 'Resign Sukarela' : 'PHK'}</td>
                                                <td className="px-6 py-4">{formatCurrency(res.severance_pay)}</td>
                                                <td className="px-6 py-4">{formatCurrency(res.upmk_pay)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs text-white ${res.status === 'approved' ? 'bg-green-500' : res.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                                                        {res.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {res.status === 'pending' && (
                                                        <button 
                                                            onClick={() => handleApprove(res.id)}
                                                            className="text-green-600 hover:underline font-bold"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Proses Offboarding Karyawan
                    </h2>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pilih Karyawan</label>
                        <select 
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
                            value={formData.employee_id}
                            onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                        >
                            <option value="">Pilih Karyawan...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.user?.name} - {emp.employee_code}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Resign / PHK</label>
                        <TextInput
                            type="date"
                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md"
                            value={formData.resign_date}
                            onChange={(e) => setFormData({...formData, resign_date: e.target.value})}
                            required
                        />
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jenis Berhenti</label>
                        <select 
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                        >
                            <option value="voluntary">Resign Sukarela</option>
                            <option value="terminated">PHK (Terminated)</option>
                        </select>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alasan</label>
                        <textarea
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
                            value={formData.reason}
                            onChange={(e) => setFormData({...formData, reason: e.target.value})}
                            required
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="mr-3 text-gray-500">
                            Batal
                        </button>
                        <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                            Hitung & Proses
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
