import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { Briefcase, MapPin, Building, Clock, ChevronRight } from 'lucide-react';

export default function Careers() {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

    useEffect(() => {
        axios.get('/api/v1/recruitment/positions')
            .then(res => {
                setPositions(res.data.data.filter(p => p.status === 'open'));
                setLoading(false);
            });
    }, []);

    const apply = (e) => {
        e.preventDefault();
        axios.post('/api/v1/recruitment/public/apply', {
            ...formData,
            job_position_id: selectedJob.id
        }).then(() => {
            alert('Lamaran berhasil dikirim! Tim kami akan segera menghubungi Anda.');
            setSelectedJob(null);
            setFormData({ name: '', email: '', phone: '' });
        }).catch(() => {
            alert('Gagal mengirim lamaran.');
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-500 selection:text-white">
            <Head title="Karier - GajiHub" />

            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">G</div>
                        <span className="font-bold text-xl tracking-tight">GajiHub Careers</span>
                    </div>
                    <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition">
                        Kembali ke Utama
                    </Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-12">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Bergabunglah Bersama Kami</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Kami mencari talenta terbaik untuk membangun masa depan bersama. Temukan posisi yang sesuai dengan passion Anda.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {positions.map(job => (
                            <div key={job.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Briefcase size={64} />
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 mb-4">
                                    <Building size={14} /> {job.department}
                                </div>
                                <h3 className="text-xl font-bold mb-2 pr-8">{job.title}</h3>
                                
                                <div className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-2"><MapPin size={16} /> {job.location || 'Remote / Jakarta'}</div>
                                    <div className="flex items-center gap-2"><Clock size={16} /> {job.type}</div>
                                </div>

                                <button onClick={() => setSelectedJob(job)} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl font-medium transition flex items-center justify-center gap-2">
                                    Lihat Detail & Lamar <ChevronRight size={16} />
                                </button>
                            </div>
                        ))}
                        {positions.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                Belum ada lowongan pekerjaan saat ini.
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Modal Lamar */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">{selectedJob.title}</h2>
                                <p className="text-gray-500">{selectedJob.department} &bull; {selectedJob.location || 'Remote'}</p>
                            </div>
                            <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="mb-8 prose dark:prose-invert max-w-none">
                                <h4>Deskripsi Pekerjaan</h4>
                                <p className="whitespace-pre-wrap text-sm">{selectedJob.description || 'Tidak ada deskripsi.'}</p>
                                <h4 className="mt-4">Persyaratan</h4>
                                <p className="whitespace-pre-wrap text-sm">{selectedJob.requirements || 'Tidak ada persyaratan khusus.'}</p>
                            </div>

                            <form onSubmit={apply} className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                                <h4 className="font-bold mb-4">Formulir Lamaran</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
                                        <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Email</label>
                                        <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Nomor Telepon</label>
                                        <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition">
                                        Kirim Lamaran Sekarang
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
