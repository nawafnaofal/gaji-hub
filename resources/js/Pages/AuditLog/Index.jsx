import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Activity, User, Clock, FileText } from 'lucide-react';

export default function AuditLogIndex({ auth }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/v1/audit-logs?page=${page}`);
            setLogs(response.data.data.data);
            setTotalPages(response.data.data.last_page);
        } catch (error) {
            console.error("Error fetching audit logs", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Jejak Audit (Activity Log)</h2>}
        >
            <Head title="Audit Log" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Activity size={20} /> Riwayat Aktivitas Sistem
                                </h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                            <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Waktu</th>
                                            <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Pengguna (Causer)</th>
                                            <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Aksi (Event)</th>
                                            <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Target (Model)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="4" className="p-4 text-center text-gray-500 dark:text-gray-400">Memuat log aktivitas...</td>
                                            </tr>
                                        ) : logs.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="p-4 text-center text-gray-500 dark:text-gray-400">Belum ada aktivitas tercatat.</td>
                                            </tr>
                                        ) : (
                                            logs.map(log => (
                                                <tr key={log.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                                                        {formatDate(log.created_at)}
                                                    </td>
                                                    <td className="p-4 font-medium text-gray-800 dark:text-gray-200">
                                                        {log.causer ? log.causer.name : 'System'}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                            log.event === 'created' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' :
                                                            log.event === 'updated' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' :
                                                            log.event === 'deleted' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400' :
                                                            'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                        }`}>
                                                            {log.event.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                                                        {log.subject_type} (ID: {log.subject_id})
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="mt-6 flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Halaman {page} dari {totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-4 py-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                                    >
                                        Sebelumnya
                                    </button>
                                    <button 
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-4 py-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
