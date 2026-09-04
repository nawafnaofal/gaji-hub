import { Head, Link } from '@inertiajs/react';
import { 
    Wallet, ShieldCheck, Users, CalendarCheck, 
    ArrowRight, CheckCircle2, Building2, ChevronRight, 
    FileText, Sparkles, Lock, BarChart3, Clock, Award
} from 'lucide-react';

export default function Welcome({ auth }) {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-blue-600 selection:text-white font-sans antialiased overflow-x-hidden">
            <Head title="Gaji-Hub - Sistem Manajemen Penggajian & HR Terpadu" />

            {/* Background Glow Orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px]"></div>
                <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-cyan-600/15 rounded-full blur-[140px]"></div>
            </div>

            {/* Navbar */}
            <header className="relative z-20 border-b border-slate-800/80 bg-slate-900/75 backdrop-blur-md sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    {/* Logo & Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                                Gaji-Hub <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">Enterprise</span>
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">Payroll & Human Resource System</span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex items-center gap-4">
                        <Link 
                            href="/careers"
                            className="text-sm font-medium text-slate-300 hover:text-white transition px-3 py-2 rounded-lg hover:bg-slate-800/60"
                        >
                            Karier & Lowongan
                        </Link>

                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition duration-200"
                            >
                                Masuk ke Dashboard <ChevronRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition duration-200"
                            >
                                <Lock className="w-4 h-4" /> Masuk ke Portal
                            </Link>
                        )}
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative z-10 pt-20 pb-16 md:pt-28 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-semibold mb-8 backdrop-blur-sm shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Solusi Terpercaya Manajemen Payroll & Karyawan Indonesia</span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
                    Pengelolaan Gaji & HR Perusahaan Lebih <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">Akurat, Cepat, dan Transparan</span>
                </h1>

                <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
                    Aplikasi internal terintegrasi untuk perhitungan gaji otomatis, perhitungan BPJS & PPh 21 TER, absensi real-time, hingga unduh slip gaji resmi karyawan.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    {auth.user ? (
                        <Link
                            href={route('dashboard')}
                            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition duration-200"
                        >
                            Buka Aplikasi Sekarang <ArrowRight className="w-5 h-5" />
                        </Link>
                    ) : (
                        <Link
                            href={route('login')}
                            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-base shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition duration-200"
                        >
                            Login ke Akun Anda <ArrowRight className="w-5 h-5" />
                        </Link>
                    )}
                    <Link
                        href="/careers"
                        className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-base transition flex items-center justify-center gap-2 backdrop-blur-sm"
                    >
                        <Building2 className="w-5 h-5 text-slate-400" /> Lihat Peluang Karier
                    </Link>
                </div>

                {/* Company Notice */}
                <div className="mt-6 text-xs text-slate-400 flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Akses portal karyawan dibuat dan diatur langsung oleh Departemen Human Resources (HR).</span>
                </div>
            </section>

            {/* Feature Cards Grid */}
            <section className="relative z-10 py-16 bg-slate-900/40 border-t border-slate-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                            Modul Utama Sistem Penggajian & Kepegawaian
                        </h2>
                        <p className="mt-3 text-sm text-slate-400">
                            Dirancang khusus untuk mendukung operasional perusahaan modern dengan kepatuhan regulasi ketenagakerjaan terkini.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <div className="bg-slate-800/50 hover:bg-slate-800/80 p-7 rounded-2xl border border-slate-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 group">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Automasi Payroll & Kalkulasi Pajak</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Perhitungan gaji pokok, lembur, tunjangan kehadiran, potongan kasbon, hingga potongan PPh 21 skema tarif efektif (TER) secara otomatis dan akurat.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-slate-800/50 hover:bg-slate-800/80 p-7 rounded-2xl border border-slate-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 group">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Slip Gaji PDF Resmi & Transparan</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Karyawan dapat langsung melihat rincian penghasilan, potongan, ringkasan absensi, dan mengunduh berkas slip gaji resmi sewaktu-waktu.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-slate-800/50 hover:bg-slate-800/80 p-7 rounded-2xl border border-slate-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 group">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                                <CalendarCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Time & Attendance (Absensi Realtime)</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Pencatatan jam masuk & jam keluar (Clock In/Out), perhitungan keterlambatan, manajemen shift kerja, serta approval cuti dan izin secara terpadu.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-slate-800/50 hover:bg-slate-800/80 p-7 rounded-2xl border border-slate-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 group">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Core HR & Manajemen Karyawan</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Basis data karyawan lengkap mulai dari NIK, posisi jabatan, departemen, jadwal kerja, dokumen kepegawaian, hingga struktur organisasi perusahaan.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-slate-800/50 hover:bg-slate-800/80 p-7 rounded-2xl border border-slate-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 group">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                                <Award className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Kasbon & Pengajuan Mandiri</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Memudahkan karyawan mengajukan permohonan kasbon darurat, pinjaman perusahaan, klaim reimbursement, dan lembur dengan persetujuan bertingkat.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-slate-800/50 hover:bg-slate-800/80 p-7 rounded-2xl border border-slate-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 group">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Keamanan & Hak Akses Berbasis Peran</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Pemisahan hak akses ketat (RBAC) antara Super Admin, Tim HRD, dan Karyawan untuk menjamin kerahasiaan data finansial perusahaan.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Stats Banner */}
            <section className="relative z-10 py-12 border-t border-b border-slate-800 bg-slate-950/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-3xl sm:text-4xl font-black text-white mb-1">100%</div>
                            <div className="text-xs sm:text-sm text-slate-400 font-medium">Kepatuhan Regulasi PPh 21 TER</div>
                        </div>
                        <div>
                            <div className="text-3xl sm:text-4xl font-black text-white mb-1">Real-time</div>
                            <div className="text-xs sm:text-sm text-slate-400 font-medium">Sinkronisasi Absensi & Potongan</div>
                        </div>
                        <div>
                            <div className="text-3xl sm:text-4xl font-black text-white mb-1">1 Klik</div>
                            <div className="text-xs sm:text-sm text-slate-400 font-medium">Generate Payroll Seluruh Karyawan</div>
                        </div>
                        <div>
                            <div className="text-3xl sm:text-4xl font-black text-white mb-1">Aman</div>
                            <div className="text-xs sm:text-sm text-slate-400 font-medium">Privasi & Hak Akses Terproteksi</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-20 text-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-800/40 border border-blue-500/20 p-8 sm:p-12 rounded-3xl backdrop-blur-md">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                        Siap Memulai Hari Kerja Anda?
                    </h2>
                    <p className="text-slate-300 text-base max-w-xl mx-auto mb-8 leading-relaxed">
                        Masuk dengan akun terdaftar perusahaan untuk mengakses absensi, slip gaji, pengajuan cuti, dan informasi kepegawaian Anda.
                    </p>
                    <div className="flex justify-center">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-xl shadow-blue-600/30 flex items-center gap-2 transition"
                            >
                                Menuju Dashboard <ChevronRight className="w-5 h-5" />
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-xl shadow-blue-600/30 flex items-center gap-2 transition"
                            >
                                <Lock className="w-4 h-4" /> Masuk ke Portal Karyawan
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 py-10 text-xs text-slate-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                            G
                        </div>
                        <span className="font-semibold text-slate-400">PT. Gaji Hub Indonesia</span>
                    </div>
                    <div>
                        © {new Date().getFullYear()} Gaji-Hub Enterprise. Seluruh hak cipta dilindungi undang-undang.
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="/careers" className="hover:text-slate-300 transition">Karier</Link>
                        <Link href={route('login')} className="hover:text-slate-300 transition">Login Portal</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
