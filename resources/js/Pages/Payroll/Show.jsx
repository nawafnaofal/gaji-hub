import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function PayrollShow({ auth, payroll_id }) {
    const [payroll, setPayroll] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayroll = async () => {
            try {
                const response = await axios.get(`/api/v1/payrolls/${payroll_id}`);
                setPayroll(response.data.data);
            } catch (error) {
                console.error("Error fetching payroll detail", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPayroll();
    }, [payroll_id]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Detail Payroll</h2>}
        >
            <Head title="Detail Payroll" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-4">
                        <Link href="/payroll" className="text-blue-600 hover:underline">&larr; Kembali ke Tabel Payroll</Link>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            {loading ? (
                                <p>Memuat rincian...</p>
                            ) : !payroll ? (
                                <p>Data tidak ditemukan.</p>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-start border-b pb-4 mb-4">
                                        <div>
                                            <h3 className="text-2xl font-bold">{payroll.employee?.user?.name}</h3>
                                            <p className="text-gray-500">ID Karyawan: {payroll.employee?.employee_code}</p>
                                            <p className="text-gray-500">Departemen: {payroll.employee?.department_id}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-700">Periode</p>
                                            <p className="text-xl">{payroll.period_month} / {payroll.period_year}</p>
                                            <span className={`inline-block mt-2 px-3 py-1 text-sm font-semibold rounded-full ${
                                                payroll.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {payroll.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="font-bold text-lg mb-2">1. Pendapatan</h4>
                                            <table className="w-full border text-left">
                                                <tbody>
                                                    <tr className="border-b">
                                                        <td className="p-3 bg-gray-50 w-2/3">Gaji Pokok</td>
                                                        <td className="p-3 font-medium text-right">{formatCurrency(payroll.total_basic)}</td>
                                                    </tr>
                                                    {payroll.details?.allowances?.overtime > 0 && (
                                                        <tr className="border-b">
                                                            <td className="p-3 bg-gray-50 w-2/3 pl-8 text-sm text-gray-600">Uang Lembur (Overtime)</td>
                                                            <td className="p-3 font-medium text-right text-sm">{formatCurrency(payroll.details.allowances.overtime)}</td>
                                                        </tr>
                                                    )}
                                                    {payroll.details?.allowances?.reimbursement > 0 && (
                                                        <tr className="border-b">
                                                            <td className="p-3 bg-gray-50 w-2/3 pl-8 text-sm text-gray-600">Reimbursement (Klaim)</td>
                                                            <td className="p-3 font-medium text-right text-sm">{formatCurrency(payroll.details.allowances.reimbursement)}</td>
                                                        </tr>
                                                    )}
                                                    <tr className="border-b bg-gray-100">
                                                        <td className="p-3 font-semibold text-gray-700 w-2/3">Total Pendapatan Tambahan</td>
                                                        <td className="p-3 font-bold text-right">{formatCurrency(payroll.total_allowance)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-lg mb-2">2. Potongan</h4>
                                            <table className="w-full border text-left">
                                                <tbody>
                                                    {payroll.details?.deductions?.late_penalty > 0 && (
                                                        <tr className="border-b">
                                                            <td className="p-3 bg-gray-50 w-2/3 pl-8 text-sm text-gray-600">Denda Keterlambatan</td>
                                                            <td className="p-3 font-medium text-red-600 text-right text-sm">- {formatCurrency(payroll.details.deductions.late_penalty)}</td>
                                                        </tr>
                                                    )}
                                                    {payroll.details?.deductions?.bpjs_kesehatan > 0 && (
                                                        <tr className="border-b">
                                                            <td className="p-3 bg-gray-50 w-2/3 pl-8 text-sm text-gray-600">BPJS Kesehatan (1%)</td>
                                                            <td className="p-3 font-medium text-red-600 text-right text-sm">- {formatCurrency(payroll.details.deductions.bpjs_kesehatan)}</td>
                                                        </tr>
                                                    )}
                                                    {payroll.details?.deductions?.bpjs_ketenagakerjaan > 0 && (
                                                        <tr className="border-b">
                                                            <td className="p-3 bg-gray-50 w-2/3 pl-8 text-sm text-gray-600">BPJS Ketenagakerjaan (3%)</td>
                                                            <td className="p-3 font-medium text-red-600 text-right text-sm">- {formatCurrency(payroll.details.deductions.bpjs_ketenagakerjaan)}</td>
                                                        </tr>
                                                    )}
                                                    {payroll.details?.deductions?.pph21 > 0 && (
                                                        <tr className="border-b">
                                                            <td className="p-3 bg-gray-50 w-2/3 pl-8 text-sm text-gray-600">PPh 21 (TER/Progressive)</td>
                                                            <td className="p-3 font-medium text-red-600 text-right text-sm">- {formatCurrency(payroll.details.deductions.pph21)}</td>
                                                        </tr>
                                                    )}
                                                    <tr className="border-b bg-gray-100">
                                                        <td className="p-3 font-semibold text-gray-700 w-2/3">Total Potongan</td>
                                                        <td className="p-3 font-bold text-red-600 text-right">- {formatCurrency(payroll.total_deduction)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center mt-6">
                                            <h4 className="font-bold text-xl text-blue-900">Total Gaji Bersih (Take Home Pay)</h4>
                                            <p className="font-bold text-2xl text-green-600">{formatCurrency(payroll.net_salary)}</p>
                                        </div>

                                    </div>
                                    
                                    <div className="mt-8 flex justify-end">
                                        <a 
                                            href={`/api/v1/payrolls/${payroll.id}/slip`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition"
                                        >
                                            Download Slip Gaji (PDF)
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
