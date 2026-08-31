import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Settings as SettingsIcon, Save, Upload, PenLine, Stamp } from 'lucide-react';

export default function Settings({ auth }) {
    const [settings, setSettings] = useState({
        company_name: '',
        company_address: '',
        company_email: '',
        bpjs_kesehatan_rate: '4',
        bpjs_ketenagakerjaan_rate: '2',
        late_penalty: '50000',
        absence_penalty: '100000'
    });
    
    const [loading, setLoading] = useState(false);
    const [signatureUrl, setSignatureUrl] = useState(null);
    const [stampUrl, setStampUrl] = useState(null);
    const [uploadingSignature, setUploadingSignature] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/v1/settings');
            if (res.data.data) {
                setSettings(prev => ({ ...prev, ...res.data.data }));
                if (res.data.data.signature_path) setSignatureUrl('/storage/' + res.data.data.signature_path);
                if (res.data.data.stamp_path) setStampUrl('/storage/' + res.data.data.stamp_path);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/v1/settings', settings);
            alert('Pengaturan berhasil disimpan!');
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan pengaturan.');
        } finally {
            setLoading(false);
        }
    };

    const uploadFile = async (type, file) => {
        if (!file) return;
        setUploadingSignature(true);
        try {
            const formData = new FormData();
            formData.append('type', type);
            formData.append('file', file);
            const res = await axios.post('/api/v1/settings/signature', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (type === 'signature') setSignatureUrl(res.data.url);
            else setStampUrl(res.data.url);
            alert(res.data.message);
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal upload file.');
        } finally {
            setUploadingSignature(false);
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Pengaturan Perusahaan</h2>}
        >
            <Head title="Pengaturan" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            
                            <div className="flex items-center gap-2 mb-6">
                                <SettingsIcon size={24} className="text-gray-500" />
                                <h3 className="text-xl font-bold">Konfigurasi HRIS & Payroll</h3>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                
                                {/* Info Perusahaan */}
                                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <h4 className="font-semibold mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">Informasi Umum</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Nama Perusahaan</label>
                                            <input type="text" name="company_name" value={settings.company_name || ''} onChange={handleChange} className="w-full rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Email Perusahaan</label>
                                            <input type="email" name="company_email" value={settings.company_email || ''} onChange={handleChange} className="w-full rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 text-sm" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-1">Alamat Lengkap</label>
                                            <textarea name="company_address" value={settings.company_address || ''} onChange={handleChange} className="w-full rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 text-sm" rows="2"></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Param Payroll */}
                                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <h4 className="font-semibold mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">Parameter Payroll & Pajak</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Potongan BPJS Kesehatan (%)</label>
                                            <input type="number" step="0.1" name="bpjs_kesehatan_rate" value={settings.bpjs_kesehatan_rate || ''} onChange={handleChange} className="w-full rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Potongan BPJS Ketenagakerjaan (%)</label>
                                            <input type="number" step="0.1" name="bpjs_ketenagakerjaan_rate" value={settings.bpjs_ketenagakerjaan_rate || ''} onChange={handleChange} className="w-full rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Denda Terlambat per Hari (Rp)</label>
                                            <input type="number" name="late_penalty" value={settings.late_penalty || ''} onChange={handleChange} className="w-full rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Potongan Mangkir per Hari (Rp)</label>
                                            <input type="number" name="absence_penalty" value={settings.absence_penalty || ''} onChange={handleChange} className="w-full rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 text-sm" />
                                        </div>
                                    </div>
                                </div>

                                {/* Tanda Tangan & Stempel */}
                                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <h4 className="font-semibold mb-4 border-b border-gray-200 dark:border-gray-600 pb-2 flex items-center gap-2">
                                        <PenLine size={16} /> Tanda Tangan &amp; Stempel Slip Gaji
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Upload tanda tangan dan stempel perusahaan yang akan muncul di slip gaji karyawan. Gunakan format PNG transparan.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Tanda Tangan Direktur/HRD</label>
                                            {signatureUrl && (
                                                <img src={signatureUrl} alt="Tanda Tangan" className="h-20 mb-2 border rounded p-1 bg-white" />
                                            )}
                                            <input type="file" accept="image/*"
                                                className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                onChange={e => uploadFile('signature', e.target.files[0])} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Stempel Perusahaan</label>
                                            {stampUrl && (
                                                <img src={stampUrl} alt="Stempel" className="h-20 mb-2 border rounded p-1 bg-white" />
                                            )}
                                            <input type="file" accept="image/*"
                                                className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                                onChange={e => uploadFile('stamp', e.target.files[0])} />
                                        </div>
                                    </div>
                                    {uploadingSignature && <p className="text-blue-600 text-sm mt-2">Mengupload...</p>}
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center gap-2 transition disabled:opacity-50 font-medium"
                                    >
                                        <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
