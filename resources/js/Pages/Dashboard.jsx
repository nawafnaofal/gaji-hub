import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    Users, DollarSign, Clock, FileText, MapPin, Camera, Calendar, Star, 
    Megaphone, CheckCircle2, AlertCircle, Building2, Home, Gift, 
    Palmtree, ArrowRight, ShieldCheck, Sparkles, RefreshCw, X, Award
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast, Toaster } from 'react-hot-toast';

export default function Dashboard() {
    const user = usePage().props.auth.user;
    const [stats, setStats] = useState(null);
    const [approvals, setApprovals] = useState([]);
    const [location, setLocation] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [distance, setDistance] = useState(null);
    const [workMode, setWorkMode] = useState('wfo');
    const [notes, setNotes] = useState('');
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [isClockingIn, setIsClockingIn] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Live Clock Ticker
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatLiveTime = (d) => {
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    };

    const formatLiveDate = (d) => {
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 11) return 'Selamat Pagi';
        if (hour < 15) return 'Selamat Siang';
        if (hour < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in metres
    };

    const fetchStats = () => {
        axios.get('/api/v1/dashboard/stats')
            .then(res => setStats(res.data.data))
            .catch(err => console.error(err));
    };

    const fetchApprovals = () => {
        if (user.role !== 'employee' || user.employee?.is_manager) {
            axios.get('/api/v1/dashboard/approvals')
                .then(res => setApprovals(res.data.data))
                .catch(err => console.error(err));
        }
    };

    useEffect(() => {
        fetchStats();
        fetchApprovals();
        // Detect initial GPS location quietly for radar
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                    setLocation(loc);
                },
                () => {},
                { enableHighAccuracy: true, timeout: 6000 }
            );
        }
    }, []);

    // Calculate distance when location and stats are available
    useEffect(() => {
        if (location && stats?.geofencing) {
            const dist = calculateDistance(
                location.latitude,
                location.longitude,
                stats.geofencing.latitude,
                stats.geofencing.longitude
            );
            setDistance(dist);
        }
    }, [location, stats]);

    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, showCameraModal]);

    const startCamera = async (clockInAction = true) => {
        setIsClockingIn(clockInAction);
        setShowCameraModal(true);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
            });
            setStream(mediaStream);
            
            // Re-check high accuracy GPS
            const loc = await getLocation();
            setLocation(loc);
            if (stats?.geofencing) {
                const dist = calculateDistance(loc.latitude, loc.longitude, stats.geofencing.latitude, stats.geofencing.longitude);
                setDistance(dist);
            }
        } catch (err) {
            console.error("Error accessing camera/location", err);
            toast.error("Gagal mengakses kamera atau lokasi GPS. Pastikan izin kamera & lokasi aktif.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCameraModal(false);
    };

    const getLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Perangkat atau browser Anda tidak mendukung fitur Geolocation"));
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });
                    },
                    (error) => {
                        let msg = "Gagal mendeteksi lokasi.";
                        if (error.code === 1) msg = "Izin akses lokasi (GPS) ditolak. Aktifkan izin lokasi browser.";
                        else if (error.code === 2) msg = "Sinyal GPS tidak tersedia.";
                        else if (error.code === 3) msg = "Waktu pencarian lokasi habis (timeout).";
                        reject(new Error(msg));
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            }
        });
    };

    const executeAttendance = async () => {
        try {
            if (!stream) {
                toast.error("Nyalakan kamera terlebih dahulu!");
                return;
            }

            // Capture photo from video stream
            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (!video || !canvas) return;

            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            const photoData = canvas.toDataURL('image/jpeg', 0.85);

            const actionLabel = isClockingIn ? 'Clock In (Masuk)' : 'Clock Out (Pulang)';
            toast.loading(`Memverifikasi lokasi & foto ${actionLabel}...`, { id: 'attendance_action' });
            
            const loc = await getLocation();
            setLocation(loc);

            const endpoint = isClockingIn ? '/api/v1/attendances/clock-in' : '/api/v1/attendances/clock-out';
            const payload = {
                latitude: loc.latitude,
                longitude: loc.longitude,
                photo: photoData,
                work_mode: workMode,
                notes: notes,
            };

            const res = await axios.post(endpoint, payload);
            toast.success(res.data.message || `${actionLabel} berhasil tercatat!`, { id: 'attendance_action' });
            stopCamera();
            fetchStats();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || error.message || 'Gagal memproses absensi.', { id: 'attendance_action' });
        }
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number || 0);
    };

    if (!stats) return (
        <AuthenticatedLayout user={user} header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Dashboard</h2>}>
            <div className="py-20 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Memuat data Dashboard Talenta...</p>
            </div>
        </AuthenticatedLayout>
    );

    const teamPulse = stats?.team_pulse || { leaves_today: [], wfh_today: [], upcoming_birthdays: [], upcoming_holidays: [] };
    const inRadius = distance !== null && stats?.geofencing && distance <= stats.geofencing.radius;

    return (
        <AuthenticatedLayout
            user={user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Dashboard</h2>}
        >
            <Head title="Dashboard - Mekari Talenta HRIS" />

            <div className="py-8 bg-gray-50/50 dark:bg-gray-900/50 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* 1. TALENTA GREETING & HERO HEADER */}
                    <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
                        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md mb-2">
                                    <Sparkles size={13} className="text-amber-300" /> Mekari Talenta ESS Portal
                                </span>
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                    {getGreeting()}, {user.name}!
                                </h1>
                                <p className="text-red-100 text-sm mt-1">
                                    {formatLiveDate(currentTime)} • <span className="font-mono font-semibold">{formatLiveTime(currentTime)}</span>
                                </p>
                            </div>

                            {/* Office Geofencing Radar Badge */}
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3">
                                <div className="relative flex items-center justify-center">
                                    <span className={`w-3 h-3 rounded-full ${workMode === 'wfh' ? 'bg-blue-400' : inRadius ? 'bg-emerald-400' : 'bg-amber-400'} animate-ping absolute`}></span>
                                    <span className={`w-3 h-3 rounded-full ${workMode === 'wfh' ? 'bg-blue-400' : inRadius ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                                </div>
                                <div className="text-left text-xs">
                                    <p className="font-bold text-white uppercase tracking-wider text-[11px]">
                                        {workMode === 'wfh' ? 'Mode WFH Aktif' : inRadius ? 'Dalam Area Kantor' : 'Di Luar Radius Kantor'}
                                    </p>
                                    <p className="text-red-100 text-[11px]">
                                        {workMode === 'wfh' 
                                            ? 'Bebas Geofencing' 
                                            : distance !== null 
                                                ? `${Math.round(distance)}m dari ${stats.geofencing?.company_name || 'Kantor'} (Maks ${stats.geofencing?.radius || 50}m)`
                                                : 'Mendeteksi GPS...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. EMPLOYEE LIVE CLOCK-IN & ESS HERO CARD */}
                    {stats.role === 'employee' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Live Clock-in Widget ala Talenta Mobile App */}
                            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-base">Presensi & Live Attendance</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Pilih mode kerja sebelum Clock In</p>
                                            </div>
                                        </div>

                                        {/* Work Mode Toggle Pills */}
                                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                                            <button
                                                type="button"
                                                onClick={() => setWorkMode('wfo')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                                                    workMode === 'wfo' 
                                                        ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm' 
                                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                                                }`}
                                            >
                                                <Building2 size={13} /> WFO (Kantor)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setWorkMode('wfh')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                                                    workMode === 'wfh' 
                                                        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                                                }`}
                                            >
                                                <Home size={13} /> WFH (Rumah)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Clock in / Clock out Time Indicators */}
                                    <div className="grid grid-cols-2 gap-4 my-6">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-750/50 rounded-xl border border-gray-100 dark:border-gray-700/60 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                                IN
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Jam Masuk</p>
                                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {stats.today_attendance?.clock_in ? stats.today_attendance.clock_in.substring(0, 5) : '--:--'}
                                                </p>
                                                {stats.today_attendance?.status && (
                                                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                        stats.today_attendance.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {stats.today_attendance.status === 'present' ? 'Tepat Waktu' : 'Terlambat'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4 bg-gray-50 dark:bg-gray-750/50 rounded-xl border border-gray-100 dark:border-gray-700/60 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                                                OUT
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Jam Pulang</p>
                                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {stats.today_attendance?.clock_out ? stats.today_attendance.clock_out.substring(0, 5) : '--:--'}
                                                </p>
                                                <span className="text-[10px] text-gray-400">
                                                    {stats.has_clocked_out ? 'Presensi Selesai' : 'Belum Absen Pulang'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => startCamera(true)}
                                        disabled={stats.has_clocked_in}
                                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition ${
                                            stats.has_clocked_in 
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                                                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                                        }`}
                                    >
                                        <Camera size={18} /> Clock In (Masuk)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => startCamera(false)}
                                        disabled={!stats.has_clocked_in || stats.has_clocked_out}
                                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition ${
                                            (!stats.has_clocked_in || stats.has_clocked_out)
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                                                : 'bg-gray-900 hover:bg-black text-white dark:bg-gray-700 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <Camera size={18} /> Clock Out (Pulang)
                                    </button>
                                </div>
                            </div>

                            {/* Sisa Cuti & Info Gaji Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Ringkasan ESS</span>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Aktif</span>
                                    </div>

                                    <div className="my-5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Sisa Kuota Cuti Tahunan</p>
                                                <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{stats.leave_balance} Hari</p>
                                            </div>
                                            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
                                                <Palmtree size={22} />
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700/60">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Slip Gaji Terakhir</p>
                                                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatRupiah(stats.last_salary)}</p>
                                            </div>
                                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                                <DollarSign size={22} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    href="/my-payslips"
                                    className="w-full py-2.5 px-4 bg-gray-50 dark:bg-gray-750 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                                >
                                    Rincian Slip Gaji <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* 3. QUICK ESS ACTION SHORTCUTS (TALENTA STYLE) */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                Layanan Mandiri Karyawan (ESS Shortcuts)
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                            <Link
                                href="/leaves"
                                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-red-400 hover:shadow-md transition flex flex-col items-center text-center group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                                    <Palmtree size={22} />
                                </div>
                                <span className="font-bold text-xs text-gray-800 dark:text-gray-200">Ajukan Cuti</span>
                                <span className="text-[10px] text-gray-400 mt-0.5">Izin & Sakit</span>
                            </Link>

                            <Link
                                href="/overtimes"
                                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-red-400 hover:shadow-md transition flex flex-col items-center text-center group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                                    <Clock size={22} />
                                </div>
                                <span className="font-bold text-xs text-gray-800 dark:text-gray-200">Ajukan Lembur</span>
                                <span className="text-[10px] text-gray-400 mt-0.5">Overtime Rate</span>
                            </Link>

                            <Link
                                href="/reimbursements"
                                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-red-400 hover:shadow-md transition flex flex-col items-center text-center group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                                    <FileText size={22} />
                                </div>
                                <span className="font-bold text-xs text-gray-800 dark:text-gray-200">Klaim Biaya</span>
                                <span className="text-[10px] text-gray-400 mt-0.5">Reimbursement</span>
                            </Link>

                            <Link
                                href="/loans"
                                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-red-400 hover:shadow-md transition flex flex-col items-center text-center group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                                    <DollarSign size={22} />
                                </div>
                                <span className="font-bold text-xs text-gray-800 dark:text-gray-200">Kasbon & Loan</span>
                                <span className="text-[10px] text-gray-400 mt-0.5">Flexible Benefits</span>
                            </Link>

                            <Link
                                href="/my-payslips"
                                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-red-400 hover:shadow-md transition flex flex-col items-center text-center group col-span-2 sm:col-span-1"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                                    <Award size={22} />
                                </div>
                                <span className="font-bold text-xs text-gray-800 dark:text-gray-200">Slip Gaji</span>
                                <span className="text-[10px] text-gray-400 mt-0.5">Unduh PDF Resmi</span>
                            </Link>
                        </div>
                    </div>

                    {/* 4. WHO'S OFF TODAY & CELEBRATIONS SECTION (SIGNATURE TALENTA FEATURE) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Who's Off Today */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Palmtree size={18} className="text-red-500" /> Siapa yang Libur / Cuti Hari Ini?
                                </h3>
                                <span className="text-xs text-gray-500">
                                    {(teamPulse.leaves_today?.length || 0) + (teamPulse.wfh_today?.length || 0)} Karyawan
                                </span>
                            </div>

                            {(!teamPulse.leaves_today || teamPulse.leaves_today.length === 0) && (!teamPulse.wfh_today || teamPulse.wfh_today.length === 0) ? (
                                <div className="py-10 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center">
                                    <CheckCircle2 size={36} className="text-emerald-500 mb-2 opacity-80" />
                                    <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Semua anggota tim hadir di kantor hari ini!</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Tidak ada yang sedang cuti atau bertugas WFH.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                                    {teamPulse.leaves_today?.map((person) => (
                                        <div key={person.id} className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center text-sm">
                                                    {person.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{person.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{person.department}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                                                🏖️ {person.status_label}
                                            </span>
                                        </div>
                                    ))}

                                    {teamPulse.wfh_today?.map((person) => (
                                        <div key={person.id} className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center text-sm">
                                                    {person.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{person.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{person.department} • In {person.clock_in}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                                🏠 WFH
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Celebrations & Holidays Widget */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between space-y-6">
                            {/* Birthdays */}
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                                    <Gift size={18} className="text-pink-500" /> Ulang Tahun Karyawan
                                </h3>
                                {teamPulse.upcoming_birthdays && teamPulse.upcoming_birthdays.length > 0 ? (
                                    <div className="space-y-2.5">
                                        {teamPulse.upcoming_birthdays.map((bday) => (
                                            <div key={bday.id} className="flex items-center justify-between text-xs p-2.5 bg-pink-50/50 dark:bg-pink-950/20 rounded-xl border border-pink-100 dark:border-pink-900/30">
                                                <div>
                                                    <p className="font-bold text-gray-800 dark:text-gray-200">{bday.name}</p>
                                                    <p className="text-gray-500">{bday.department}</p>
                                                </div>
                                                <span className="font-semibold text-pink-600 dark:text-pink-400">
                                                    🎂 {bday.date} {bday.days_left === 0 ? '(Hari ini!)' : `(${bday.days_left} hr lagi)`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 py-3">Tidak ada ulang tahun dalam 14 hari ke depan.</p>
                                )}
                            </div>

                            {/* Upcoming Holidays */}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                                    <Calendar size={18} className="text-red-500" /> Hari Libur Terdekat
                                </h3>
                                {teamPulse.upcoming_holidays && teamPulse.upcoming_holidays.length > 0 ? (
                                    <div className="space-y-2">
                                        {teamPulse.upcoming_holidays.map((hol) => (
                                            <div key={hol.id} className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">{hol.name}</span>
                                                <span className="font-semibold text-red-600 dark:text-red-400">{hol.date}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400">Belum ada agenda libur nasional tercatat.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 5. HR & ADMIN MANAGEMENT METRICS & CHARTS */}
                    {stats.role !== 'employee' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Karyawan</p>
                                        <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.total_employees}</p>
                                    </div>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl text-blue-600 dark:text-blue-400"><Users size={24}/></div>
                                </div>
                                
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Estimasi Payroll Bulan Ini</p>
                                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatRupiah(stats.total_payroll_cost)}</p>
                                    </div>
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl text-emerald-600 dark:text-emerald-400"><DollarSign size={24}/></div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Menunggu Approval Cuti</p>
                                        <p className="text-2xl font-black text-amber-500 mt-1">{stats.pending_leaves}</p>
                                    </div>
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-2xl text-amber-600 dark:text-amber-400"><FileText size={24}/></div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Menunggu Klaim Biaya</p>
                                        <p className="text-2xl font-black text-purple-500 mt-1">{stats.pending_claims}</p>
                                    </div>
                                    <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-2xl text-purple-600 dark:text-purple-400"><DollarSign size={24}/></div>
                                </div>
                            </div>

                            {/* Charts & Analytics */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Tren Biaya Payroll (6 Bulan Terakhir)</h3>
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={stats.chart_data}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                                                <XAxis dataKey="name" stroke="#6B7280" />
                                                <YAxis stroke="#6B7280" tickFormatter={(value) => `Rp ${value / 1000000}M`} />
                                                <Tooltip formatter={(value) => formatRupiah(value)} />
                                                <Line type="monotone" dataKey="total" stroke="#EF4444" strokeWidth={3} dot={{r: 4, fill: '#EF4444'}} activeDot={{r: 6}} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Distribusi Kehadiran Hari Ini</h3>
                                    <div className="h-72 w-full flex justify-center items-center">
                                        {stats.attendance_stats ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={stats.attendance_stats}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={65}
                                                        outerRadius={95}
                                                        paddingAngle={4}
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

                            {/* Approvals Center & Top KPI */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Clock size={18} className="text-red-500" /> Pusat Persetujuan (Needs Approval)
                                    </h3>
                                    <div className="flex-1 overflow-y-auto max-h-80 custom-scrollbar pr-1 space-y-3">
                                        {approvals.length > 0 ? approvals.map((approval) => (
                                            <div key={`${approval.module}-${approval.id}`} className="bg-gray-50 dark:bg-gray-750/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300">
                                                            {approval.type_label}
                                                        </span>
                                                        <p className="mt-1 font-bold text-gray-800 dark:text-gray-200">{approval.employee_name}</p>
                                                    </div>
                                                    <span className="text-xs text-gray-400">{approval.created_at}</span>
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{approval.details}</p>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            toast.loading('Menyetujui...', {id: 'approve'});
                                                            axios.put(`/api/v1/${approval.module === 'leave' ? 'leaves' : approval.module === 'cash_advance' ? 'cash-advances' : approval.module + 's'}/${approval.id}/status`, { status: user.role === 'employee' ? 'pending_hr' : 'approved' })
                                                                .then(() => { toast.success('Disetujui', {id: 'approve'}); fetchApprovals(); fetchStats(); })
                                                                .catch(() => toast.error('Gagal menyetujui', {id: 'approve'}));
                                                        }}
                                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 rounded-lg transition"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            if(!confirm('Tolak pengajuan ini?')) return;
                                                            toast.loading('Menolak...', {id: 'reject'});
                                                            axios.put(`/api/v1/${approval.module === 'leave' ? 'leaves' : approval.module === 'cash_advance' ? 'cash-advances' : approval.module + 's'}/${approval.id}/status`, { status: 'rejected' })
                                                                .then(() => { toast.success('Ditolak', {id: 'reject'}); fetchApprovals(); fetchStats(); })
                                                                .catch(() => toast.error('Gagal menolak', {id: 'reject'}));
                                                        }}
                                                        className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-red-600 hover:text-white text-gray-700 dark:text-gray-300 text-xs font-bold py-1.5 rounded-lg transition"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 py-10">
                                                <FileText size={40} className="mb-2 opacity-50" />
                                                <p className="text-xs">Tidak ada pengajuan tertunda.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                                        <Star size={18} className="text-amber-500 fill-amber-500" /> Top Karyawan Berkinerja (KPI)
                                    </h3>
                                    <div className="space-y-3">
                                        {stats.top_kpi && stats.top_kpi.length > 0 ? (
                                            stats.top_kpi.map((kpi, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-3.5 bg-gray-50 dark:bg-gray-750/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                                                            #{idx + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-sm text-gray-800 dark:text-gray-200">{kpi.name}</div>
                                                            <div className="text-[11px] text-gray-400">Periode: {kpi.period}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex items-center gap-1.5">
                                                        <div className="text-xl font-extrabold text-red-600 dark:text-red-400">{kpi.score}</div>
                                                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Skor</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-gray-400 py-4 text-center">Belum ada data penilaian kinerja.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* 6. ANNOUNCEMENTS SECTION */}
                    {stats.announcements && stats.announcements.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                                <Megaphone size={18} className="text-red-500" /> Pengumuman Perusahaan
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {stats.announcements.map(announcement => (
                                    <div key={announcement.id} className="p-4 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30">
                                        <h4 className="font-bold text-red-900 dark:text-red-300 text-sm">{announcement.title}</h4>
                                        <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line mt-1.5">{announcement.content}</p>
                                        <div className="text-[10px] text-gray-400 mt-2.5">
                                            {new Date(announcement.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* LIVE CAMERA & GEOFENCING MODAL */}
            {showCameraModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 relative">
                        <button 
                            type="button" 
                            onClick={stopCamera} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                                <Camera size={20} className="text-red-600" /> 
                                {isClockingIn ? 'Clock In (Absen Masuk)' : 'Clock Out (Absen Pulang)'}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Mode: <strong className="uppercase text-red-600">{workMode}</strong> • Pastikan wajah Anda terlihat jelas
                            </p>
                        </div>

                        {/* Video Camera Container */}
                        <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-inner mb-4">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                            
                            {/* Live Radar overlay badge */}
                            <div className="absolute top-3 left-3 right-3 flex justify-between items-center pointer-events-none">
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md ${
                                    workMode === 'wfh' 
                                        ? 'bg-blue-600 text-white' 
                                        : inRadius 
                                            ? 'bg-emerald-600 text-white' 
                                            : 'bg-amber-600 text-white'
                                }`}>
                                    {workMode === 'wfh' ? 'Mode WFH' : inRadius ? `✓ Dalam Radius (${Math.round(distance || 0)}m)` : `✗ Luar Radius (${Math.round(distance || 0)}m)`}
                                </span>
                                <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded font-mono">
                                    {formatLiveTime(currentTime)}
                                </span>
                            </div>
                        </div>

                        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

                        {/* Notes input */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Catatan (opsional, misal: Dinas Luar, WFH, dll)..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full text-xs rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 py-2 dark:text-white"
                            />
                        </div>

                        {/* Warning if outside radius and WFO */}
                        {workMode === 'wfo' && !inRadius && (
                            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Anda berada di luar radius kantor ({Math.round(distance || 0)}m).</p>
                                    <p className="text-[11px] mt-0.5">Jika Anda bekerja dari rumah, ubah mode kerja menjadi <strong>WFH</strong>.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={stopCamera}
                                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={executeAttendance}
                                disabled={workMode === 'wfo' && !inRadius}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm ${
                                    workMode === 'wfo' && !inRadius
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                }`}
                            >
                                Ambil Foto & {isClockingIn ? 'Masuk' : 'Pulang'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Toaster position="top-right" />
        </AuthenticatedLayout>
    );
}
