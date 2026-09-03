import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PlusCircle, Users, FileText, Trash2, Upload, Edit, Trash } from 'lucide-react';

export default function EmployeeIndex({ auth }) {
    const [employees, setEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showDocModal, setShowDocModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [docForm, setDocForm] = useState({ title: '', file: null });
    const [errors, setErrors] = useState({});
    const [expiringCount, setExpiringCount] = useState(0);
    const [filterExpiring, setFilterExpiring] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        department_id: '',
        employee_code: '',
        basic_salary: '',
        join_date: '',
        job_title: '',
        employment_status: '',
        bank_name: '',
        bank_account: '',
        npwp_number: '',
        bpjs_kesehatan: '',
        bpjs_ketenagakerjaan: '',
        phone: '',
        address: '',
        manager_id: '',
        tax_status: 'TK/0',
        resign_date: '',
        termination_reason: '',
        role: 'employee'
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await axios.get('/api/v1/employees');
            setEmployees(response.data.data);
            setExpiringCount(response.data.expiring_count || 0);
        } catch (error) {
            console.error("Error fetching employees", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const openAddModal = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData({
            name: '', email: '', department_id: '', employee_code: '', basic_salary: '', join_date: '',
            job_title: '', employment_status: '', bank_name: '', bank_account: '', npwp_number: '',
            bpjs_kesehatan: '', bpjs_ketenagakerjaan: '', phone: '', address: '', manager_id: '', tax_status: 'TK/0',
            resign_date: '', termination_reason: '', role: 'employee'
        });
        setErrors({});
        setShowModal(true);
    };

    const handleEdit = (emp) => {
        setIsEditing(true);
        setEditId(emp.id);
        setFormData({
            name: emp.user?.name || '',
            email: emp.user?.email || '',
            department_id: emp.department_id || '',
            employee_code: emp.employee_code || '',
            basic_salary: emp.basic_salary || '',
            join_date: emp.join_date || '',
            job_title: emp.job_title || '',
            employment_status: emp.employment_status || '',
            bank_name: emp.bank_name || '',
            bank_account: emp.bank_account || '',
            npwp_number: emp.npwp_number || '',
            bpjs_kesehatan: emp.bpjs_kesehatan || '',
            bpjs_ketenagakerjaan: emp.bpjs_ketenagakerjaan || '',
            phone: emp.phone || '',
            address: emp.address || '',
            manager_id: emp.manager_id || '',
            tax_status: emp.tax_status || 'TK/0',
            resign_date: emp.resign_date || '',
            termination_reason: emp.termination_reason || '',
            role: emp.user?.role || 'employee'
        });
        setErrors({});
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Anda yakin ingin menghapus data karyawan ini beserta user-nya?')) return;
        try {
            await axios.delete(`/api/v1/employees/${id}`);
            fetchEmployees();
        } catch (error) {
            console.error("Error deleting employee", error);
            alert("Gagal menghapus karyawan.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        try {
            if (isEditing) {
                await axios.put(`/api/v1/employees/${editId}`, formData);
            } else {
                await axios.post('/api/v1/employees', formData);
            }
            setShowModal(false);
            fetchEmployees();
        } catch (error) {
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
            }
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const openDocModal = async (emp) => {
        setSelectedEmployee(emp);
        setShowDocModal(true);
        fetchDocuments(emp.id);
    };

    const fetchDocuments = async (empId) => {
        try {
            const res = await axios.get(`/api/v1/employees/${empId}/documents`);
            setDocuments(res.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDocUpload = async (e) => {
        e.preventDefault();
        if (!docForm.file || !docForm.title) return;
        setUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('title', docForm.title);
        formDataUpload.append('file', docForm.file);

        try {
            await axios.post(`/api/v1/employees/${selectedEmployee.id}/documents`, formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setDocForm({ title: '', file: null });
            fetchDocuments(selectedEmployee.id);
        } catch (error) {
            alert('Gagal upload dokumen');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const deleteDocument = async (docId) => {
        if (!confirm('Hapus dokumen ini?')) return;
        try {
            await axios.delete(`/api/v1/documents/${docId}`);
            fetchDocuments(selectedEmployee.id);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Manajemen Karyawan</h2>}
        >
            <Head title="Manajemen Karyawan" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            
                            {/* Contract Expiry Warning Banner */}
                            {expiringCount > 0 && (
                                <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
                                        <span className="text-2xl">⏳</span>
                                        <div>
                                            <p className="font-bold text-sm">Peringatan Jatuh Tempo Kontrak (PKWT / Probation)</p>
                                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                                Terdapat <strong>{expiringCount} karyawan</strong> yang masa kontrak/probation kerjanya akan berakhir dalam 30 hari ke depan.
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setFilterExpiring(!filterExpiring)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                            filterExpiring 
                                                ? 'bg-amber-600 text-white shadow' 
                                                : 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-800/60 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100'
                                        }`}
                                    >
                                        {filterExpiring ? 'Tampilkan Semua Karyawan' : 'Filter Karyawan Akan Habis Kontrak'}
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Users size={20} /> Data Induk Karyawan {filterExpiring && <span className="text-xs font-normal text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">(Filter Kontrak Berakhir)</span>}
                                </h3>
                                <button 
                                    onClick={openAddModal}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
                                >
                                    <PlusCircle size={18} /> Tambah Karyawan
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                            <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Data Karyawan</th>
                                            <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Posisi & Status</th>
                                            <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Kontak</th>
                                            <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Gaji Pokok</th>
                                            <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(filterExpiring ? employees.filter(e => e.is_expiring_soon) : employees).length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="p-4 text-center text-gray-500 dark:text-gray-400">Belum ada data karyawan.</td>
                                            </tr>
                                        ) : (
                                            (filterExpiring ? employees.filter(e => e.is_expiring_soon) : employees).map(emp => (
                                                <tr key={emp.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="p-4">
                                                        <div className="font-medium text-gray-800 dark:text-gray-200">{emp.user?.name}</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{emp.employee_code} | {emp.user?.email}</div>
                                                    </td>
                                                    <td className="p-4 text-gray-600 dark:text-gray-300">
                                                        <div className="font-medium">{emp.job_title || '-'}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {emp.department_id} - 
                                                            <span className={`ml-1 uppercase text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                                ['resigned', 'terminated'].includes(emp.employment_status)
                                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                            }`}>
                                                                {emp.employment_status || '-'}
                                                            </span>
                                                        </div>
                                                        {emp.is_expiring_soon && (
                                                            <div className="mt-1">
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded">
                                                                    ⚠️ Habis {emp.days_remaining} hari lagi
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-gray-600 dark:text-gray-300">
                                                        <div>{emp.phone || '-'}</div>
                                                    </td>
                                                    <td className="p-4 text-gray-600 dark:text-gray-300">
                                                        <div className="font-medium">{formatCurrency(emp.basic_salary)}</div>
                                                        <div className="text-xs text-gray-500">Bank: {emp.bank_name || '-'}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={() => openDocModal(emp)} 
                                                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium transition bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded"
                                                            >
                                                                <FileText size={16} /> Dokumen
                                                            </button>
                                                            <button 
                                                                onClick={() => handleEdit(emp)} 
                                                                className="text-orange-500 hover:text-orange-700 flex items-center gap-1 text-sm font-medium transition bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(emp.id)} 
                                                                className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm font-medium transition bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded"
                                                            >
                                                                <Trash size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
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

            {/* Modal Tambah Karyawan */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <h3 className="text-xl font-bold dark:text-white">{isEditing ? 'Edit Data Karyawan' : 'Registrasi Karyawan Baru'}</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Karyawan</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kode Pegawai (NIK)</label>
                                    <input type="text" name="employee_code" value={formData.employee_code} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                    {errors.employee_code && <p className="text-red-500 text-xs mt-1">{errors.employee_code[0]}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Departemen</label>
                                    <select name="department_id" value={formData.department_id} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                        <option value="">Pilih Departemen...</option>
                                        <option value="IT">IT</option>
                                        <option value="HR">HR</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Operations">Operations</option>
                                    </select>
                                    {errors.department_id && <p className="text-red-500 text-xs mt-1">{errors.department_id[0]}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jabatan (Job Title)</label>
                                    <input type="text" name="job_title" value={formData.job_title} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status Kepegawaian</label>
                                    <select name="employment_status" value={formData.employment_status} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                        <option value="">Pilih Status...</option>
                                        <option value="permanent">Tetap (Permanent)</option>
                                        <option value="contract">Kontrak (Contract)</option>
                                        <option value="probation">Masa Percobaan (Probation)</option>
                                        <option value="resigned">Resign (Mengundurkan Diri)</option>
                                        <option value="terminated">Terminated (Diberhentikan)</option>
                                    </select>
                                </div>
                            </div>

                            {(formData.employment_status === 'resigned' || formData.employment_status === 'terminated') && (
                                <div className="grid grid-cols-2 gap-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                                    <div>
                                        <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">Tanggal Keluar</label>
                                        <input type="date" name="resign_date" value={formData.resign_date} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">Alasan Keluar</label>
                                        <input type="text" name="termination_reason" value={formData.termination_reason} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Misal: Pindah perusahaan" />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role Sistem</label>
                                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                        <option value="employee">Karyawan (Employee)</option>
                                        <option value="manager">Manajer (Manager)</option>
                                        <option value="hr">HRD (HR)</option>
                                        <option value="admin">Administrator (Admin)</option>
                                    </select>
                                    {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role[0]}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manajer Langsung</label>
                                    <select name="manager_id" value={formData.manager_id} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                        <option value="">Tidak ada manajer</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.user?.name} ({emp.employee_code})</option>
                                        ))}
                                    </select>
                                    {errors.manager_id && <p className="text-red-500 text-xs mt-1">{errors.manager_id[0]}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status Pajak (PTKP)</label>
                                    <select name="tax_status" value={formData.tax_status} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                        <option value="TK/0">TK/0 (Tidak Kawin, 0 Tanggungan)</option>
                                        <option value="TK/1">TK/1 (Tidak Kawin, 1 Tanggungan)</option>
                                        <option value="TK/2">TK/2 (Tidak Kawin, 2 Tanggungan)</option>
                                        <option value="TK/3">TK/3 (Tidak Kawin, 3 Tanggungan)</option>
                                        <option value="K/0">K/0 (Kawin, 0 Tanggungan)</option>
                                        <option value="K/1">K/1 (Kawin, 1 Tanggungan)</option>
                                        <option value="K/2">K/2 (Kawin, 2 Tanggungan)</option>
                                        <option value="K/3">K/3 (Kawin, 3 Tanggungan)</option>
                                    </select>
                                    {errors.tax_status && <p className="text-red-500 text-xs mt-1">{errors.tax_status[0]}</p>}
                                </div>
                            </div>

                            <hr className="dark:border-gray-700 my-4" />

                            <h4 className="font-semibold dark:text-gray-200">Data Payroll & Pajak</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gaji Pokok (Rp)</label>
                                    <input type="number" name="basic_salary" value={formData.basic_salary} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                    {errors.basic_salary && <p className="text-red-500 text-xs mt-1">{errors.basic_salary[0]}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal Masuk</label>
                                    <input type="date" name="join_date" value={formData.join_date} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                    {errors.join_date && <p className="text-red-500 text-xs mt-1">{errors.join_date[0]}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Bank</label>
                                    <input type="text" name="bank_name" placeholder="Misal: BCA" value={formData.bank_name} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nomor Rekening</label>
                                    <input type="text" name="bank_account" value={formData.bank_account} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NPWP</label>
                                    <input type="text" name="npwp_number" value={formData.npwp_number} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">BPJS Kesehatan</label>
                                    <input type="text" name="bpjs_kesehatan" value={formData.bpjs_kesehatan} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">BPJS Ketenagakerjaan</label>
                                    <input type="text" name="bpjs_ketenagakerjaan" value={formData.bpjs_ketenagakerjaan} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                            </div>
                            
                            <hr className="dark:border-gray-700 my-4" />
                            <h4 className="font-semibold dark:text-gray-200">Informasi Kontak</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nomor Telepon</label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alamat Lengkap</label>
                                    <textarea name="address" rows="2" value={formData.address} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-700">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition">Batal</button>
                                <button type="submit" className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition">{isEditing ? 'Simpan Perubahan' : 'Simpan Karyawan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal Dokumen */}
            {showDocModal && selectedEmployee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold dark:text-white">Dokumen: {selectedEmployee.user?.name}</h3>
                            <button onClick={() => setShowDocModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                            {/* Upload Form */}
                            <form onSubmit={handleDocUpload} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3">
                                <h4 className="font-medium dark:text-gray-200 mb-2">Upload Dokumen Baru</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="Nama Dokumen (KTP, KK, dll)" 
                                        className="w-full text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded focus:ring-blue-500" 
                                        value={docForm.title} 
                                        onChange={e => setDocForm({...docForm, title: e.target.value})} 
                                    />
                                    <input 
                                        type="file" 
                                        required 
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded p-2" 
                                        onChange={e => setDocForm({...docForm, file: e.target.files[0]})} 
                                    />
                                </div>
                                <button type="submit" disabled={uploading} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-2">
                                    {uploading ? 'Mengupload...' : <><Upload size={16}/> Upload</>}
                                </button>
                            </form>

                            {/* List Dokumen */}
                            <div>
                                <h4 className="font-medium dark:text-gray-200 mb-3">Daftar Dokumen</h4>
                                {documents.length === 0 ? (
                                    <p className="text-gray-500 text-sm">Belum ada dokumen.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {documents.map(doc => (
                                            <li key={doc.id} className="flex justify-between items-center p-3 border dark:border-gray-700 rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <div className="flex items-center gap-3">
                                                    <FileText size={20} className="text-gray-400" />
                                                    <a href={doc.file_path} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm">
                                                        {doc.title}
                                                    </a>
                                                </div>
                                                <button onClick={() => deleteDocument(doc.id)} className="text-red-500 hover:text-red-700" title="Hapus Dokumen">
                                                    <Trash2 size={16} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}
