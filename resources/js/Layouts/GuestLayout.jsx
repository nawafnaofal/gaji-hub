import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-12 text-slate-100 selection:bg-blue-600 selection:text-white">
            <div className="mb-6 flex flex-col items-center">
                <Link href="/" className="flex items-center gap-3">
                    <ApplicationLogo className="h-12 w-12" />
                    <div className="flex flex-col text-left">
                        <span className="text-2xl font-black tracking-tight text-white">Gaji-Hub</span>
                        <span className="text-xs text-slate-400 font-medium">Enterprise Payroll & HR System</span>
                    </div>
                </Link>
            </div>

            <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/80 p-8 shadow-2xl backdrop-blur-md sm:max-w-md">
                {children}
            </div>
        </div>
    );
}
