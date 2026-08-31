import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function SalaryComponentIndex({ auth }) {
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', type: 'allowance', default_amount: '' });
    const [errors, setErrors] = useState({});

    const fetchComponents = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/salary-components');
            setComponents(response.data.data);
        } catch (error) {
            console.error("Error fetching components", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComponents();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        // Client-side Validation (Example)
        if (!form.name || form.name.length < 3) {
            setErrors({ name: ['Nama komponen harus diisi (minimal 3 karakter).'] });
            return;
        }

        try {
            await axios.post('/api/v1/salary-components', form);
            setShowModal(false);
            setForm({ name: '', type: 'allowance', default_amount: '' });
            fetchComponents(); // Refresh
        } catch (error) {
            if (error.response && error.response.data && error.response.data.errors) {
                // Server-side validation errors
                setErrors(error.response.data.errors);
            }
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Komponen Gaji</h2>}
        >
            <Head title="Komponen Gaji" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            
                            <div className="mb-6 flex justify-between items-center">
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Master Data Komponen Gaji</h1>
                                <button 
                                    onClick={() => setShowModal(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition"
                                >
                                    + Tambah Komponen
                                </button>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                                            <th className="p-4 font-semibold">Nama Komponen</th>
                                            <th className="p-4 font-semibold">Tipe</th>
                                            <th className="p-4 font-semibold">Nominal Default</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {loading ? (
                                            <tr><td colSpan="3" className="p-8 text-center text-gray-500 dark:text-gray-400">Memuat data...</td></tr>
                                        ) : components.length === 0 ? (
                                            <tr><td colSpan="3" className="p-8 text-center text-gray-500 dark:text-gray-400">Belum ada komponen gaji.</td></tr>
                                        ) : (
                                            components.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                                    <td className="p-4 font-medium text-gray-800 dark:text-gray-200">{item.name}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                            item.type === 'allowance' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                                                        }`}>
                                                            {item.type === 'allowance' ? 'Tunjangan' : 'Potongan'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-gray-600 dark:text-gray-400">{formatCurrency(item.default_amount)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Form Tambah Komponen */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                        <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold dark:text-white">Tambah Komponen Gaji</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Komponen</label>
                                <input 
                                    type="text" 
                                    className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 dark:bg-gray-700 dark:text-gray-200 ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                    placeholder="Contoh: Tunjangan Makan"
                                    value={form.name}
                                    onChange={(e) => setForm({...form, name: e.target.value})}
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipe</label>
                                <select 
                                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100"
                                    value={form.type}
                                    onChange={(e) => setForm({...form, type: e.target.value})}
                                >
                                    <option value="allowance">Tunjangan</option>
                                    <option value="deduction">Potongan</option>
                                </select>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nominal Default (Rp)</label>
                                <input 
                                    type="number" 
                                    className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 dark:bg-gray-700 dark:text-gray-200 ${errors.default_amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                    placeholder="Contoh: 500000"
                                    value={form.default_amount}
                                    onChange={(e) => setForm({...form, default_amount: e.target.value})}
                                />
                                {errors.default_amount && <p className="text-red-500 text-xs mt-1">{errors.default_amount[0]}</p>}
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
