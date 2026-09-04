import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Masuk Portal - Gaji-Hub" />

            <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-white tracking-tight">Selamat Datang Kembali</h2>
                <p className="text-xs text-slate-400 mt-1">Masuk untuk mengakses portal absensi, slip gaji, dan data kepegawaian Anda.</p>
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-400" /> Email Perusahaan
                    </label>

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        placeholder="nama@perusahaan.com"
                        className="w-full rounded-xl border-slate-700 bg-slate-900/90 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500 text-sm px-4 py-2.5"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-1.5" />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-blue-400" /> Kata Sandi
                        </label>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs text-blue-400 hover:text-blue-300 transition"
                            >
                                Lupa sandi?
                            </Link>
                        )}
                    </div>

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        placeholder="••••••••"
                        className="w-full rounded-xl border-slate-700 bg-slate-900/90 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500 text-sm px-4 py-2.5"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-1.5" />
                </div>

                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center cursor-pointer">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                        />
                        <span className="ms-2 text-xs text-slate-300">
                            Ingat saya di perangkat ini
                        </span>
                    </label>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50"
                    >
                        {processing ? 'Memproses Masuk...' : 'Masuk ke Akun'} <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500">
                        Belum memiliki akun? Hubungi <strong className="text-slate-400 font-semibold">Tim HRD / Administrator</strong> untuk aktivasi akun karyawan Anda.
                    </p>
                </div>
            </form>
        </GuestLayout>
    );
}
