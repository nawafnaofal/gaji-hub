import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Calculator, DollarSign, Building2, User, HelpCircle, ShieldCheck, ArrowRight, PieChart } from 'lucide-react';

export default function SalarySimulatorIndex({ auth }) {
    const [basicSalary, setBasicSalary] = useState(8000000);
    const [allowance, setAllowance] = useState(1000000);
    const [taxStatus, setTaxStatus] = useState('TK/0');
    const [includeBpjsTk, setIncludeBpjsTk] = useState(true);
    const [includeBpjsKes, setIncludeBpjsKes] = useState(true);

    const bruto = Number(basicSalary || 0) + Number(allowance || 0);

    // BPJS Calculations
    // Employee Portion
    const bpjsTkJhtEmp = includeBpjsTk ? Number(basicSalary) * 0.02 : 0;
    const bpjsTkJpEmp = includeBpjsTk ? Math.min(Number(basicSalary), 10042300) * 0.01 : 0; // 2024 cap
    const bpjsKesEmp = includeBpjsKes ? Math.min(Number(basicSalary), 12000000) * 0.01 : 0;
    const totalDeductionEmp = bpjsTkJhtEmp + bpjsTkJpEmp + bpjsKesEmp;

    // Employer Portion (Company Cost)
    const bpjsTkJhtComp = includeBpjsTk ? Number(basicSalary) * 0.037 : 0;
    const bpjsTkJkkComp = includeBpjsTk ? Number(basicSalary) * 0.0024 : 0;
    const bpjsTkJkmComp = includeBpjsTk ? Number(basicSalary) * 0.0030 : 0;
    const bpjsTkJpComp = includeBpjsTk ? Math.min(Number(basicSalary), 10042300) * 0.02 : 0;
    const bpjsKesComp = includeBpjsKes ? Math.min(Number(basicSalary), 12000000) * 0.04 : 0;
    const totalCompanyBenefit = bpjsTkJhtComp + bpjsTkJkkComp + bpjsTkJkmComp + bpjsTkJpComp + bpjsKesComp;

    // PPh 21 TER 2024 (PP 58 / PMK 168 Tahun 2023)
    const kategoriA = ['TK/0', 'TK/1', 'K/0'];
    const kategoriB = ['TK/2', 'TK/3', 'K/1', 'K/2'];
    // Kategori C = K/3

    let terRate = 0;
    if (kategoriA.includes(taxStatus)) {
        if (bruto <= 5400000) terRate = 0;
        else if (bruto <= 5650000) terRate = 0.0025;
        else if (bruto <= 5950000) terRate = 0.005;
        else if (bruto <= 6300000) terRate = 0.0075;
        else if (bruto <= 6750000) terRate = 0.01;
        else if (bruto <= 7500000) terRate = 0.0125;
        else if (bruto <= 8550000) terRate = 0.015;
        else if (bruto <= 9650000) terRate = 0.0175;
        else if (bruto <= 10050000) terRate = 0.02;
        else if (bruto <= 10350000) terRate = 0.0225;
        else if (bruto <= 10700000) terRate = 0.025;
        else if (bruto <= 12500000) terRate = 0.03;
        else if (bruto <= 15000000) terRate = 0.05;
        else if (bruto <= 20000000) terRate = 0.07;
        else terRate = 0.09;
    } else if (kategoriB.includes(taxStatus)) {
        if (bruto <= 6200000) terRate = 0;
        else if (bruto <= 6500000) terRate = 0.0025;
        else if (bruto <= 6850000) terRate = 0.005;
        else if (bruto <= 7300000) terRate = 0.0075;
        else if (bruto <= 9200000) terRate = 0.015;
        else if (bruto <= 10050000) terRate = 0.0175;
        else if (bruto <= 10700000) terRate = 0.025;
        else if (bruto <= 12500000) terRate = 0.03;
        else if (bruto <= 15000000) terRate = 0.05;
        else if (bruto <= 20000000) terRate = 0.07;
        else terRate = 0.09;
    } else {
        // Kategori C (K/3)
        if (bruto <= 6600000) terRate = 0;
        else if (bruto <= 6950000) terRate = 0.0025;
        else if (bruto <= 7350000) terRate = 0.005;
        else if (bruto <= 7800000) terRate = 0.0075;
        else if (bruto <= 8850000) terRate = 0.01;
        else if (bruto <= 9800000) terRate = 0.0125;
        else if (bruto <= 10700000) terRate = 0.025;
        else if (bruto <= 12500000) terRate = 0.03;
        else if (bruto <= 15000000) terRate = 0.05;
        else if (bruto <= 20000000) terRate = 0.07;
        else terRate = 0.09;
    }

    const pph21 = Math.round(bruto * terRate);
    const netTakeHomePay = Math.round(bruto - totalDeductionEmp - pph21);
    const totalCompanyCost = Math.round(bruto + totalCompanyBenefit);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Kalkulator Simulasi Gaji & PPh 21</h2>}
        >
            <Head title="Kalkulator Gaji & PPh 21" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold mb-2">
                                <Calculator size={14} /> Simulasi Resmi TER 2024 & BPJS Ketenagakerjaan/Kesehatan
                            </div>
                            <h1 className="text-2xl font-bold">Kalkulator Offering Gaji & Pajak</h1>
                            <p className="text-emerald-100 text-sm mt-1">
                                Perkirakan Take Home Pay kandidat dan Total Biaya Perusahaan (Cost to Company) secara instan dan akurat.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Form Input Parameters (Left - 5 Cols) */}
                        <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b dark:border-gray-700 pb-3">
                                <DollarSign size={18} className="text-emerald-600" /> Parameter Offering Gaji
                            </h3>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Gaji Pokok (Basic Salary)</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-gray-500">Rp</span>
                                    <input
                                        type="number"
                                        step="100000"
                                        value={basicSalary}
                                        onChange={e => setBasicSalary(e.target.value)}
                                        className="w-full pl-10 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm font-semibold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Tunjangan Tetap / Lembur Rata-rata</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-gray-500">Rp</span>
                                    <input
                                        type="number"
                                        step="50000"
                                        value={allowance}
                                        onChange={e => setAllowance(e.target.value)}
                                        className="w-full pl-10 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm font-semibold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Status Pajak PTKP (Kategori TER)</label>
                                <select
                                    value={taxStatus}
                                    onChange={e => setTaxStatus(e.target.value)}
                                    className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm font-semibold"
                                >
                                    <optgroup label="Kategori TER A">
                                        <option value="TK/0">TK/0 - Tidak Kawin, 0 Tanggungan (TER A)</option>
                                        <option value="TK/1">TK/1 - Tidak Kawin, 1 Tanggungan (TER A)</option>
                                        <option value="K/0">K/0 - Kawin, 0 Tanggungan (TER A)</option>
                                    </optgroup>
                                    <optgroup label="Kategori TER B">
                                        <option value="TK/2">TK/2 - Tidak Kawin, 2 Tanggungan (TER B)</option>
                                        <option value="TK/3">TK/3 - Tidak Kawin, 3 Tanggungan (TER B)</option>
                                        <option value="K/1">K/1 - Kawin, 1 Tanggungan (TER B)</option>
                                        <option value="K/2">K/2 - Kawin, 2 Tanggungan (TER B)</option>
                                    </optgroup>
                                    <optgroup label="Kategori TER C">
                                        <option value="K/3">K/3 - Kawin, 3 Tanggungan (TER C)</option>
                                    </optgroup>
                                </select>
                            </div>

                            <div className="pt-2 border-t dark:border-gray-700 space-y-3">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Kepesertaan Jaminan Sosial</label>
                                
                                <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeBpjsTk}
                                        onChange={e => setIncludeBpjsTk(e.target.checked)}
                                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div className="text-xs">
                                        <p className="font-bold text-gray-900 dark:text-white">BPJS Ketenagakerjaan</p>
                                        <p className="text-gray-500">JHT 2%, JP 1% (Karyawan) & JHT, JKK, JKM, JP (Perusahaan)</p>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeBpjsKes}
                                        onChange={e => setIncludeBpjsKes(e.target.checked)}
                                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div className="text-xs">
                                        <p className="font-bold text-gray-900 dark:text-white">BPJS Kesehatan</p>
                                        <p className="text-gray-500">1% (Karyawan) & 4% (Perusahaan) - Cap Rp 12.000.000</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Calculation Results (Right - 7 Cols) */}
                        <div className="lg:col-span-7 space-y-6">
                            
                            {/* Comparison Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Take Home Pay Card */}
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs uppercase font-bold tracking-wider text-blue-200">Gaji Bersih Diterima</span>
                                        <User size={20} className="text-blue-200" />
                                    </div>
                                    <h2 className="text-3xl font-black">{formatCurrency(netTakeHomePay)}</h2>
                                    <p className="text-xs text-blue-100 mt-2">
                                        Take Home Pay (THP) yang masuk ke rekening karyawan setiap bulan.
                                    </p>
                                </div>

                                {/* Company Cost Card */}
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">Total Biaya Perusahaan (CTC)</span>
                                        <Building2 size={20} className="text-emerald-200" />
                                    </div>
                                    <h2 className="text-3xl font-black">{formatCurrency(totalCompanyCost)}</h2>
                                    <p className="text-xs text-emerald-100 mt-2">
                                        Termasuk Gaji Bruto + BPJS porsi pemberi kerja (5 komponen).
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Breakdown */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b dark:border-gray-700 pb-3">
                                    <PieChart size={18} className="text-blue-600" /> Rincian Potongan & Iuran Bulanan
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Kolom Karyawan */}
                                    <div className="space-y-2.5 text-xs">
                                        <div className="flex justify-between font-bold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-1.5 text-sm">
                                            <span>Potongan Gaji Karyawan</span>
                                            <span className="text-red-600">-{formatCurrency(totalDeductionEmp + pph21)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                            <span>BPJS TK JHT (2%)</span>
                                            <span>{formatCurrency(bpjsTkJhtEmp)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                            <span>BPJS TK JP (1%)</span>
                                            <span>{formatCurrency(bpjsTkJpEmp)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                            <span>BPJS Kesehatan (1%)</span>
                                            <span>{formatCurrency(bpjsKesEmp)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 dark:text-gray-300 font-semibold pt-1 border-t dark:border-gray-700">
                                            <span>PPh 21 TER ({(terRate * 100).toFixed(2)}%)</span>
                                            <span className="text-red-500">{formatCurrency(pph21)}</span>
                                        </div>
                                    </div>

                                    {/* Kolom Perusahaan */}
                                    <div className="space-y-2.5 text-xs">
                                        <div className="flex justify-between font-bold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-1.5 text-sm">
                                            <span>Iuran Tambahan Perusahaan</span>
                                            <span className="text-emerald-600">+{formatCurrency(totalCompanyBenefit)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                            <span>BPJS TK JHT (3.7%)</span>
                                            <span>{formatCurrency(bpjsTkJhtComp)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                            <span>BPJS TK JKK (0.24%)</span>
                                            <span>{formatCurrency(bpjsTkJkkComp)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                            <span>BPJS TK JKM (0.30%)</span>
                                            <span>{formatCurrency(bpjsTkJkmComp)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                            <span>BPJS TK JP (2%)</span>
                                            <span>{formatCurrency(bpjsTkJpComp)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 dark:text-gray-300 font-semibold pt-1 border-t dark:border-gray-700">
                                            <span>BPJS Kesehatan (4%)</span>
                                            <span>{formatCurrency(bpjsKesComp)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                    <p>💡 <strong>Gaji Bruto:</strong> {formatCurrency(bruto)} ({taxStatus})</p>
                                    <p>💡 <strong>Efisiensi Pajak:</strong> Tarif Efektif Rata-Rata (TER) yang dikenakan adalah <strong>{(terRate * 100).toFixed(2)}%</strong> sesuai ketentuan perpajakan PP 58 Tahun 2023.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
