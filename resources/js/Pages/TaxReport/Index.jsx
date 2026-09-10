import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { 
    FileSpreadsheet, Download, Search, Eye, RefreshCw, 
    CheckCircle2, AlertCircle, FileText, Building2, User, 
    Calendar, Calculator, HelpCircle, X, ShieldCheck
} from 'lucide-react';

export default function TaxReportIndex({ auth }) {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [reports, setReports] = useState([]);
    const [summary, setSummary] = useState({
        total_employees: 0,
        total_gross: 0,
        total_tax_payable: 0,
        total_tax_withheld: 0,
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Preview Modal state
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const isPrivileged = ['admin', 'hr'].includes(auth.user.role);

    const fetchReports = async () => {
        setLoading(true);
        try {
            if (isPrivileged) {
                const res = await axios.get(`/api/v1/tax-reports?year=${year}`);
                if (res.data.success) {
                    setReports(res.data.data);
                    setSummary(res.data.summary);
                }
            } else {
                // Employee self-service
                const res = await axios.get(`/api/v1/tax-reports/my?year=${year}`);
                if (res.data.success) {
                    setReports([
                        {
                            employee: {
                                id: res.data.data.employee.id,
                                name: res.data.data.employee.user?.name,
                                employee_code: res.data.data.employee.employee_code,
                                job_title: res.data.data.employee.job_title || res.data.data.employee.position,
                                department: res.data.data.employee.department_id,
                                npwp_number: res.data.data.employee.npwp_number,
                                tax_status: res.data.data.tax_status,
                            },
                            period_months: res.data.data.period_months_string,
                            gross_income: res.data.data.gross_income,
                            net_income: res.data.data.net_income,
                            ptkp: res.data.data.ptkp,
                            pkp: res.data.data.pkp,
                            tax_payable: res.data.data.tax_payable,
                            tax_withheld: res.data.data.tax_withheld,
                            tax_difference: res.data.data.tax_difference,
                            status_label: res.data.data.tax_difference === 0 ? 'NIHIL' : 'LUNAS',
                        }
                    ]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch tax reports:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [year]);

    const handleOpenPreview = async (emp) => {
        setSelectedEmployee(emp);
        setIsPreviewOpen(true);
        setLoadingPreview(true);
        try {
            const endpoint = isPrivileged 
                ? `/api/v1/tax-reports/${emp.id}/preview?year=${year}`
                : `/api/v1/tax-reports/my?year=${year}`;
            const res = await axios.get(endpoint);
            if (res.data.success) {
                setPreviewData(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleDownloadPdf = (empId) => {
        const url = isPrivileged 
            ? `/api/v1/tax-reports/${empId}/pdf?year=${year}`
            : `/api/v1/tax-reports/my/pdf?year=${year}`;
        window.open(url, '_blank');
    };

    const filteredReports = reports.filter(r => 
        r.employee.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.employee.employee_code?.toLowerCase().includes(search.toLowerCase()) ||
        r.employee.npwp_number?.toLowerCase().includes(search.toLowerCase())
    );

    const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileSpreadsheet className="w-7 h-7 text-blue-600" />
                            Formulir Pajak Tahunan 1721-A1
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Bukti Pemotongan PPh 21 Tahunan resmi standar DJP untuk pelaporan SPT Tahunan Orang Pribadi.
                        </p>
                    </div>

                    {/* Year Selector */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="text-xs font-semibold text-gray-500">Tahun Pajak:</span>
                            <select
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                className="text-sm font-bold text-gray-900 dark:text-white bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                            >
                                <option value={2026}>2026</option>
                                <option value={2025}>2025</option>
                                <option value={2024}>2024</option>
                                <option value={2023}>2023</option>
                            </select>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Laporan Pajak 1721-A1 (${year})`} />

            <div className="py-6 max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
                {/* Metric Summary Cards */}
                {isPrivileged && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Karyawan</p>
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
                                {summary.total_employees}
                            </h3>
                            <p className="text-[11px] text-gray-500 mt-1">Pegawai terdaftar pajak {year}</p>
                        </div>

                        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Penghasilan Bruto Setahun</p>
                            <h3 className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                                {formatRupiah(summary.total_gross)}
                            </h3>
                            <p className="text-[11px] text-gray-500 mt-1">Gaji Pokok, Tunjangan, &amp; THR</p>
                        </div>

                        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total PPh 21 Terutang</p>
                            <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                                {formatRupiah(summary.total_tax_payable)}
                            </h3>
                            <p className="text-[11px] text-gray-500 mt-1">Tarif Progresif UU HPP</p>
                        </div>

                        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Status Penyetoran</p>
                            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                                <CheckCircle2 size={20} />
                                100% Lunas / Nihil
                            </h3>
                            <p className="text-[11px] text-gray-500 mt-1">Dipungut rutin via payroll bulanan</p>
                        </div>
                    </div>
                )}

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama karyawan, kode, atau NPWP..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={fetchReports}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Muat Ulang Data
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="py-20 text-center text-gray-400">
                            <RefreshCw size={32} className="mx-auto animate-spin mb-3 text-blue-500" />
                            <p className="text-sm">Menghitung akumulasi PPh 21 tahunan &amp; 1721-A1...</p>
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="py-16 text-center text-gray-500">
                            <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <h4 className="text-base font-semibold">Tidak ada data pajak untuk tahun {year}</h4>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50/75 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-5 py-3.5">Karyawan</th>
                                        <th className="px-4 py-3.5">NPWP &amp; Status PTKP</th>
                                        <th className="px-4 py-3.5 text-center">Masa Kerja</th>
                                        <th className="px-4 py-3.5 text-right">Penghasilan Bruto</th>
                                        <th className="px-4 py-3.5 text-right">PKP Setahun</th>
                                        <th className="px-4 py-3.5 text-right">PPh 21 Terutang</th>
                                        <th className="px-4 py-3.5 text-center">Status</th>
                                        <th className="px-5 py-3.5 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredReports.map((row) => (
                                        <tr key={row.employee.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition">
                                            <td className="px-5 py-4">
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">
                                                        {row.employee.name}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {row.employee.employee_code} • {row.employee.job_title}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <p className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                    {row.employee.npwp_number}
                                                </p>
                                                <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                                    PTKP: {row.employee.tax_status}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 text-center font-mono text-xs font-bold text-gray-600 dark:text-gray-300">
                                                {row.period_months}
                                            </td>

                                            <td className="px-4 py-4 text-right font-bold text-gray-900 dark:text-white">
                                                {formatRupiah(row.gross_income)}
                                            </td>

                                            <td className="px-4 py-4 text-right font-semibold text-gray-600 dark:text-gray-300">
                                                {formatRupiah(row.pkp)}
                                            </td>

                                            <td className="px-4 py-4 text-right font-bold text-blue-600 dark:text-blue-400">
                                                {formatRupiah(row.tax_payable)}
                                            </td>

                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                    <CheckCircle2 size={12} />
                                                    NIHIL
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenPreview(row.employee)}
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                                                        title="Pratinjau 20 Poin Formulir 1721-A1"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadPdf(row.employee.id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition"
                                                        title="Unduh Formulir 1721-A1 PDF Resmi DJP"
                                                    >
                                                        <Download size={13} />
                                                        PDF
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Pratinjau 20 Poin 1721-A1 */}
            {isPreviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header Modal */}
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                                    Pratinjau Formulir 1721-A1 (Tahun Pajak {year})
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Rincian 21 poin kalkulasi pajak penghasilan Pasal 21 pegawai tetap standar DJP.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsPreviewOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content Modal */}
                        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-5">
                            {loadingPreview || !previewData ? (
                                <div className="py-12 text-center text-gray-400">
                                    <RefreshCw size={24} className="mx-auto animate-spin mb-2 text-blue-500" />
                                    <p className="text-xs">Memuat detail rincian 1721-A1...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Identitas Card */}
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                        <div>
                                            <span className="text-gray-400">Nomor Bukti Potong:</span>
                                            <p className="font-mono font-bold text-gray-900 dark:text-white">{previewData.tax_number}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Masa Kerja:</span>
                                            <p className="font-bold text-gray-900 dark:text-white">Bulan {previewData.period_months_string} ({previewData.service_months} bln)</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">NPWP Karyawan:</span>
                                            <p className="font-mono font-bold text-gray-900 dark:text-white">{previewData.employee?.npwp_number || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Status PTKP:</span>
                                            <p className="font-bold text-purple-600 dark:text-purple-400">{previewData.tax_status}</p>
                                        </div>
                                    </div>

                                    {/* Rincian Poin 1 s/d 21 */}
                                    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
                                        {/* Bagian A: Bruto */}
                                        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-bold text-gray-700 dark:text-gray-200 uppercase">
                                            A. Penghasilan Bruto
                                        </div>
                                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                            <div className="px-4 py-2 flex justify-between">
                                                <span>1. Gaji / Pensiun / THT / JHT</span>
                                                <span className="font-mono font-semibold">{formatRupiah(previewData.point1_gaji)}</span>
                                            </div>
                                            <div className="px-4 py-2 flex justify-between">
                                                <span>2. Tunjangan PPh</span>
                                                <span className="font-mono">{formatRupiah(previewData.point2_tunjangan_pph)}</span>
                                            </div>
                                            <div className="px-4 py-2 flex justify-between">
                                                <span>3. Tunjangan Lainnya, Uang Lembur, dsb.</span>
                                                <span className="font-mono">{formatRupiah(previewData.point3_tunjangan_lain)}</span>
                                            </div>
                                            <div className="px-4 py-2 flex justify-between">
                                                <span>5. Premi Asuransi Dibayar Pemberi Kerja (JKK, JKM, BPJS Kes)</span>
                                                <span className="font-mono">{formatRupiah(previewData.point5_premi_asuransi)}</span>
                                            </div>
                                            <div className="px-4 py-2 flex justify-between">
                                                <span>7. Tantiem, Bonus, Gratifikasi, Jasa Produksi, THR</span>
                                                <span className="font-mono font-semibold text-blue-600">{formatRupiah(previewData.point7_bonus_thr)}</span>
                                            </div>
                                            <div className="px-4 py-2 flex justify-between font-bold bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                                                <span>8. JUMLAH PENGHASILAN BRUTO (1 s/d 7)</span>
                                                <span className="font-mono">{formatRupiah(previewData.point8_bruto)}</span>
                                            </div>
                                        </div>

                                        {/* Bagian B: Pengurangan */}
                                        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-bold text-gray-700 dark:text-gray-200 uppercase mt-2">
                                            B. Pengurangan
                                        </div>
                                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                            <div className="px-4 py-2 flex justify-between">
                                                <span>9. Biaya Jabatan (5% x Bruto, maks Rp 500rb/bln)</span>
                                                <span className="font-mono">{formatRupiah(previewData.point9_biaya_jabatan)}</span>
                                            </div>
                                            <div className="px-4 py-2 flex justify-between">
                                                <span>10. Iuran Pensiun / JHT yang dibayar sendiri (BPJS JHT 2% + JP 1%)</span>
                                                <span className="font-mono">{formatRupiah(previewData.point10_iuran_pensiun)}</span>
                                            </div>
                                            <div className="px-4 py-2 flex justify-between font-bold bg-amber-50/50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                                                <span>11. JUMLAH PENGURANGAN (9 + 10)</span>
                                                <span className="font-mono">{formatRupiah(previewData.point11_total_pengurangan)}</span>
                                            </div>
                                        </div>

                                        {/* Bagian C: Perhitungan PPh 21 */}
                                        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-bold text-gray-700 dark:text-gray-200 uppercase mt-2">
                                            C. Penghitungan PPh Pasal 21
                                        </div>
                                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                            <div className="px-4 py-2 flex justify-between">
                                                <span>12. Jumlah Penghasilan Neto (8 - 11)</span>
                                                <span className="font-mono font-semibold">{formatRupiah(previewData.point12_neto)}</span>
                                            </div>
                                            <div className="px-4 py-2 flex justify-between">
                                                <span>15. Penghasilan Tidak Kena Pajak (PTKP) [{previewData.tax_status}]</span>
                                                <span className="font-mono text-purple-600">{formatRupiah(previewData.point15_ptkp)}</span>
                                            </div>
                                            <div className="px-4 py-2 flex justify-between font-bold">
                                                <span>16. Penghasilan Kena Pajak (PKP) Setahun</span>
                                                <span className="font-mono">{formatRupiah(previewData.point16_pkp)}</span>
                                            </div>
                                            <div className="px-4 py-2 flex justify-between font-bold text-blue-600 dark:text-blue-400">
                                                <span>17. PPh Pasal 21 Terutang (Tarif Progresif UU HPP)</span>
                                                <span className="font-mono">{formatRupiah(previewData.point17_pph21_terutang)}</span>
                                            </div>
                                            <div className="px-4 py-2 flex justify-between">
                                                <span>20. PPh Pasal 21 yang Telah Dipotong Melalui Payroll</span>
                                                <span className="font-mono text-emerald-600 font-semibold">{formatRupiah(previewData.point20_pph21_telah_dipotong)}</span>
                                            </div>
                                            <div className="px-4 py-2 flex justify-between font-bold bg-emerald-50/60 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                                <span>21. PPh Pasal 21 Kurang / (Lebih) Dipotong</span>
                                                <span className="font-mono">
                                                    {previewData.point21_selisih === 0 ? 'Rp 0 (NIHIL)' : formatRupiah(previewData.point21_selisih)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer Modal */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                            <span className="text-xs text-gray-500">
                                Sah untuk pelaporan SPT Tahunan Orang Pribadi (1770 S / 1770 SS)
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsPreviewOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700 rounded-xl"
                                >
                                    Tutup
                                </button>
                                {selectedEmployee && (
                                    <button
                                        onClick={() => handleDownloadPdf(selectedEmployee.id)}
                                        className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md flex items-center gap-1.5"
                                    >
                                        <Download size={14} />
                                        Unduh PDF Resmi DJP
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
