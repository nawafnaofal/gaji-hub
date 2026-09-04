import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PlusCircle, Banknote, CheckCircle, XCircle } from 'lucide-react';

export default function CashAdvanceIndex({ auth }) {
    const [cashAdvances, setCashAdvances] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    
    const isEmployee = auth.user.role === 'employee';

    const [formData, setFormData] = useState({
        employee_id: auth.user.employee?.id || '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        reason: ''
    });

    useEffect(() => {
        fetchCashAdvances();
        if (!isEmployee) {
            fetchEmployees();
        }
    }, []);

    const fetchCashAdvances = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/v1/cash-advances');
            setCashAdvances(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get('/api/v1/employees');
            setEmployees(res.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        try {
            const payload = {
                ...formData,
                employee_id: isEmployee ? auth.user.employee?.id : formData.employee_id
            };
            await axios.post('/api/v1/cash-advances', payload);
            setShowModal(false);
            setFormData({ 
                employee_id: isEmployee ? auth.user.employee?.id : '', 
                date: new Date().toISOString().split('T')[0], 
                amount: '', 
                reason: '' 
            });
            fetchCashAdvances();
            alert('Pengajuan kasbon berhasil dikirim!');
        } catch (error) {
            if (error.response?.data?.message) {
                alert(error.response.data.message);
            }
            if (error.response?.status === 422 && error.response.data.errors) {
                setErrors(error.response.data.errors);
            }
        }
    };

    const updateStatus = async (id, status) => {
        if (!confirm(`Tandai kasbon ini sebagai ${status}?`)) return;
        try {
            // HR/Admin use the updateStatus endpoint
            await axios.put(`/api/v1/cash-advances/${id}`, { status });
            fetchCashAdvances();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Gagal mengubah status kasbon.');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const canApprove = (item) => {
        if (isEmployee) return false;
        return item.status === 'pending_hr' || item.status === 'pending' || item.status === 'pending_manager';
    };

    const showActionColumn = !isEmployee;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Kasbon / Pinjaman Karyawan</h2>}
        >
            <Head title="Kasbon" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Banknote size={20} /> {isEmployee ? 'Riwayat Kasbon Saya' : 'Data Kasbon Karyawan'}
                                </h3>
                                <button 
                                    onClick={() => setShowModal(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
                                >
                                    <PlusCircle size={18} /> Ajukan Kasbon
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                            <th className="p-4 font-semibold">Tanggal</th>
                                            {!isEmployee && <th className="p-4 font-semibold">Karyawan</th>}
                                            <th className="p-4 font-semibold">Nominal</th>
                                            <th className="p-4 font-semibold">Keterangan</th>
                                            <th className="p-4 font-semibold text-center">Status</th>
                                            {showActionColumn && (
                                                <th className="p-4 font-semibold text-center">Aksi</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {loading ? (
                                            <tr><td colSpan={!isEmployee ? "6" : "4"} className="p-8 text-center text-gray-500">Memuat data...</td></tr>
                                        ) : cashAdvances.length === 0 ? (
                                            <tr><td colSpan={!isEmployee ? "6" : "4"} className="p-8 text-center text-gray-500">Belum ada data kasbon.</td></tr>
                                        ) : (
                                            cashAdvances.map(item => (
                                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                                    <td className="p-4 text-sm">{item.date}</td>
                                                    {!isEmployee && (
                                                        <td className="p-4">
                                                            <div className="font-medium text-gray-800 dark:text-gray-200">{item.employee?.user?.name}</div>
                                                            <div className="text-xs text-gray-500">{item.employee?.employee_code}</div>
                                                        </td>
                                                    )}
                                                    <td className="p-4 font-semibold text-gray-700 dark:text-gray-300">
                                                        {formatCurrency(item.amount)}
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {item.reason || '-'}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                            item.status === 'paid' ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                                                            item.status === 'approved' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' :
                                                            item.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400' :
                                                            'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
                                                        }`}>
                                                            {item.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    {showActionColumn && (
                                                        <td className="p-4 text-center">
                                                            {canApprove(item) && (
                                                                <div className="flex justify-center gap-2">
                                                                    <button onClick={() => updateStatus(item.id, 'approved')} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 p-1 rounded transition" title="Setujui">
                                                                        <CheckCircle size={18} />
                                                                    </button>
                                                                    <button onClick={() => updateStatus(item.id, 'rejected')} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded transition" title="Tolak">
                                                                        <XCircle size={18} />
                                                                    </button>
                                                                </div>
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
            </div>

            {/* Modal Form Kasbon */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-4 overflow-hidden shadow-xl">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                            <h3 className="text-lg font-bold dark:text-white">Pengajuan Kasbon</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {!isEmployee ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Karyawan</label>
                                    <select name="employee_id" value={formData.employee_id} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md text-sm">
                                        <option value="">Pilih Karyawan...</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.user?.name} - {emp.employee_code}</option>
                                        ))}
                                    </select>
                                    {errors.employee_id && <p className="text-red-500 text-xs mt-1">{errors.employee_id[0]}</p>}
                                </div>
                            ) : (
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Pengaju (Diri Sendiri)</p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{auth.user.name} ({auth.user.employee?.employee_code || '-'})</p>
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal Pengajuan</label>
                                <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md text-sm" />
                                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date[0]}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nominal (Rp)</label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md text-sm" placeholder="Contoh: 1000000" />
                                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount[0]}</p>}
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5">
                                    💡 <strong>Kebijakan Perusahaan:</strong> Maksimal kasbon adalah 50% dari gaji pokok dan hanya diizinkan 1 kasbon aktif per periode.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keterangan / Alasan</label>
                                <textarea name="reason" rows="2" value={formData.reason} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md text-sm"></textarea>
                                {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason[0]}</p>}
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t dark:border-gray-700">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-md">Batal</button>
                                <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md">Simpan Ajuan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}
