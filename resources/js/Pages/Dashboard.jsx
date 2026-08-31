import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Users, DollarSign, Clock, FileText, MapPin, Camera, Calendar, Star } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { Megaphone } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

export default function Dashboard() {
    const user = usePage().props.auth.user;
    const [stats, setStats] = useState(null);
    const [location, setLocation] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);

    const fetchStats = () => {
        axios.get('/api/v1/dashboard/stats')
            .then(res => setStats(res.data.data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
        } catch (err) {
            console.error("Error accessing camera", err);
            toast.error("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const getLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser"));
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });
                    },
                    (error) => {
                        reject(error);
                    }
                );
            }
        });
    };

    const handleClockIn = async () => {
        try {
            if (!stream) {
                toast.error("Silakan nyalakan kamera terlebih dahulu!");
                return;
            }

            // Capture photo
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            const photoData = canvas.toDataURL('image/jpeg');

            toast.loading("Mendapatkan lokasi dan mengirim data absen...", { id: 'clockin' });
            
            const loc = await getLocation();
            setLocation(loc);

            const res = await axios.post('/api/v1/attendances/clock-in', {
                latitude: loc.latitude,
                longitude: loc.longitude,
                photo: photoData
            });

            toast.success(res.data.message, { id: 'clockin' });
            stopCamera();
            fetchStats();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || error.message || 'Gagal Clock In', { id: 'clockin' });
        }
    };

    const handleClockOut = async () => {
        try {
            const res = await axios.post('/api/v1/attendances/clock-out');
            toast.success(res.data.message);
            fetchStats();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal Clock Out');
        }
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
    };

    if (!stats) return (
        <AuthenticatedLayout user={user} header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Dashboard</h2>}>
            <div className="py-12"><div className="max-w-7xl mx-auto sm:px-6 lg:px-8 text-center dark:text-gray-400">Memuat data...</div></div>
        </AuthenticatedLayout>
    );

    return (
        <AuthenticatedLayout
            user={user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Dashboard</h2>}
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {stats.role === 'employee' ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-blue-500">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Gaji Terakhir</p>
                                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatRupiah(stats.last_salary)}</p>
                                        </div>
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-400"><DollarSign size={24}/></div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-purple-500">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Sisa Cuti Tahunan</p>
                                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.leave_balance} Hari</p>
                                        </div>
                                        <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full text-purple-600 dark:text-purple-400"><Calendar size={24}/></div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-orange-500">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Cuti Menunggu Persetujuan</p>
                                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.pending_leaves}</p>
                                        </div>
                                        <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-full text-orange-600 dark:text-orange-400"><Clock size={24}/></div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-green-500">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Cuti Disetujui</p>
                                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.approved_leaves}</p>
                                        </div>
                                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full text-green-600 dark:text-green-400"><FileText size={24}/></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Selamat Datang di Portal Karyawan!</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">Gunakan menu di navigasi untuk mengajukan cuti, reimbursement, dan melihat slip gaji Anda.</p>
                                
                                <div className="border-t dark:border-gray-700 pt-6">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Absensi Kehadiran Hari Ini</h4>
                                    
                                    {!stats.has_clocked_in && (
                                        <div className="mb-4">
                                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg flex flex-col items-center">
                                                {!stream ? (
                                                    <button onClick={startCamera} className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-4 py-2 rounded flex items-center gap-2 mb-2">
                                                        <Camera size={20} /> Nyalakan Kamera untuk Absen
                                                    </button>
                                                ) : (
                                                    <div className="relative w-full max-w-sm aspect-video bg-black rounded overflow-hidden">
                                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                                                    </div>
                                                )}
                                                <p className="text-xs text-gray-500 mt-2">*Kamera dan Lokasi (GPS) wajib aktif untuk Clock In.</p>
                                            </div>
                                            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <button 
                                            onClick={handleClockIn}
                                            disabled={stats.has_clocked_in || !stream}
                                            className={`px-6 py-3 rounded-lg font-semibold shadow-sm transition flex items-center gap-2 ${(stats.has_clocked_in || !stream) ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                        >
                                            <Clock size={18} /> Clock In (Masuk)
                                        </button>
                                        <button 
                                            onClick={handleClockOut}
                                            disabled={!stats.has_clocked_in || stats.has_clocked_out}
                                            className={`px-6 py-3 rounded-lg font-semibold shadow-sm transition flex items-center gap-2 ${(!stats.has_clocked_in || stats.has_clocked_out) ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                                        >
                                            <Clock size={18} /> Clock Out (Pulang)
                                        </button>
                                    </div>
                                    {stats.has_clocked_in && <p className="mt-2 text-sm text-green-600 dark:text-green-400">Anda sudah absen masuk hari ini.</p>}
                                    {stats.has_clocked_out && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Anda sudah absen pulang hari ini.</p>}
                                </div>
                            </div>

                            {/* Announcements Section */}
                            {stats.announcements && stats.announcements.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-indigo-500">
                                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4 dark:text-white">
                                        <Megaphone size={20} className="text-indigo-500" /> Pengumuman Terbaru
                                    </h3>
                                    <div className="space-y-4">
                                        {stats.announcements.map(announcement => (
                                            <div key={announcement.id} className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                                <h4 className="font-semibold text-indigo-900 dark:text-indigo-300">{announcement.title}</h4>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line mt-1">{announcement.content}</p>
                                                <div className="text-xs text-gray-500 mt-2">
                                                    {new Date(announcement.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Toaster />
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-blue-500">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Karyawan</p>
                                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.total_employees}</p>
                                        </div>
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-400"><Users size={24}/></div>
                                    </div>
                                </div>
                                
                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-green-500">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Biaya Payroll (Bulan Berjalan)</p>
                                            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{formatRupiah(stats.total_payroll_cost)}</p>
                                        </div>
                                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full text-green-600 dark:text-green-400"><DollarSign size={24}/></div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-orange-500">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Persetujuan Cuti</p>
                                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.pending_leaves}</p>
                                        </div>
                                        <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-full text-orange-600 dark:text-orange-400"><FileText size={24}/></div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-purple-500">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Persetujuan Klaim</p>
                                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.pending_claims}</p>
                                        </div>
                                        <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full text-purple-600 dark:text-purple-400"><DollarSign size={24}/></div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Tren Biaya Payroll (6 Bulan Terakhir)</h3>
                                    <div className="h-80 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={stats.chart_data}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                                                <XAxis dataKey="name" stroke="#6B7280" />
                                                <YAxis stroke="#6B7280" tickFormatter={(value) => `Rp ${value / 1000000}M`} />
                                                <Tooltip formatter={(value) => formatRupiah(value)} />
                                                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={3} dot={{r: 4, fill: '#3B82F6'}} activeDot={{r: 6}} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Tingkat Kehadiran Hari Ini</h3>
                                    <div className="h-80 w-full flex justify-center items-center">
                                        {stats.attendance_stats ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={stats.attendance_stats}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={70}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {stats.attendance_stats.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend verticalAlign="bottom" height={36}/>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <p className="text-gray-500">Data belum tersedia.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Distribusi Karyawan Per Departemen</h3>
                                    <div className="h-80 w-full">
                                        {stats.department_dist ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={stats.department_dist}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.2} />
                                                    <XAxis dataKey="name" stroke="#6B7280" />
                                                    <YAxis stroke="#6B7280" allowDecimals={false} />
                                                    <Tooltip cursor={{fill: 'rgba(139, 92, 246, 0.1)'}} />
                                                    <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Karyawan" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <p className="text-gray-500">Data belum tersedia.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4 dark:text-white">
                                        <Star size={20} className="text-yellow-500 fill-yellow-500" /> Karyawan Berkinerja Terbaik (Top KPI)
                                    </h3>
                                    <div className="space-y-4">
                                        {stats.top_kpi && stats.top_kpi.length > 0 ? (
                                            stats.top_kpi.map((kpi, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                                                            #{idx + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-800 dark:text-gray-200">{kpi.name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">Periode: {kpi.period}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex items-center gap-2">
                                                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{kpi.score}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">Score</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 dark:text-gray-400">Belum ada data penilaian kinerja.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Announcements Section */}
                            {stats.announcements && stats.announcements.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-indigo-500">
                                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4 dark:text-white">
                                        <Megaphone size={20} className="text-indigo-500" /> Pengumuman Terbaru
                                    </h3>
                                    <div className="space-y-4">
                                        {stats.announcements.map(announcement => (
                                            <div key={announcement.id} className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                                <h4 className="font-semibold text-indigo-900 dark:text-indigo-300">{announcement.title}</h4>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line mt-1">{announcement.content}</p>
                                                <div className="text-xs text-gray-500 mt-2">
                                                    {new Date(announcement.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
