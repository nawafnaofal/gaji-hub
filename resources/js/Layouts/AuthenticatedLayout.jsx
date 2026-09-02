import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
    Sun, Moon, Bell, Menu, X, 
    LayoutDashboard, Megaphone, Users, CalendarCheck, 
    WalletCards, Receipt, Settings as SettingsIcon, Calendar, 
    Coffee, Clock, Banknote, LogOut, User, Activity, FileCheck, Laptop, Star, Network, BarChart3, AlarmClock, Target, Briefcase, UserMinus, CalendarClock
} from 'lucide-react';
import { useTheme } from '@/Components/ThemeProvider';
import axios from 'axios';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const { isDarkMode, toggleTheme } = useTheme();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('/api/v1/notifications');
            setNotifications(res.data.data.notifications);
            setUnreadCount(res.data.data.unread_count);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await axios.put(`/api/v1/notifications/${id}/mark-read`);
            fetchNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put('/api/v1/notifications/mark-all-read');
            fetchNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    const SidebarLink = ({ href, active, icon: Icon, children }) => (
        <Link
            href={href}
            className={`flex items-center px-4 py-3 mb-1 text-sm font-medium rounded-xl transition-colors duration-200 ${
                active 
                    ? 'bg-blue-600 text-white shadow-md dark:shadow-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
        >
            <Icon size={20} className={`mr-3 ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
            {children}
        </Link>
    );

    const SidebarGroup = ({ title }) => (
        <div className="px-4 mt-6 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
            {title}
        </div>
    );

    const isAdminOrHr = ['admin', 'hr'].includes(user.role);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-gray-900/50 dark:bg-gray-900/80 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside 
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
                    sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                } flex flex-col`}
            >
                {/* Sidebar Header / Logo */}
                <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100 dark:border-gray-800/50">
                    <Link href="/" className="flex items-center gap-3">
                        <ApplicationLogo className="w-auto h-8 text-blue-600 fill-current" />
                        <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Gaji-Hub</span>
                    </Link>
                    <button 
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Sidebar Links */}
                <div className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar">
                    <SidebarGroup title="Utama" />
                    <SidebarLink href={route('dashboard')} active={route().current('dashboard')} icon={LayoutDashboard}>
                        Dashboard
                    </SidebarLink>
                    {isAdminOrHr && (
                        <SidebarLink href={route('announcements')} active={route().current('announcements')} icon={Megaphone}>
                            Pengumuman
                        </SidebarLink>
                    )}
                    <SidebarLink href={route('company-documents')} active={route().current('company-documents')} icon={FileCheck}>
                        Dokumen Perusahaan
                    </SidebarLink>
                    <SidebarLink href={route('assets')} active={route().current('assets')} icon={Laptop}>
                        Manajemen Aset
                    </SidebarLink>

                    {isAdminOrHr && (
                        <>
                            <SidebarGroup title="Karyawan & HR" />
                            <SidebarLink href={route('employees')} active={route().current('employees')} icon={Users}>
                        Data Karyawan
                    </SidebarLink>
                    <SidebarLink href={route('org-chart')} active={route().current('org-chart')} icon={Network}>
                        Struktur Organisasi
                    </SidebarLink>
                    <SidebarLink href={route('attendances')} active={route().current('attendances')} icon={CalendarCheck}>
                                Rekap Absensi
                            </SidebarLink>
                            <SidebarLink href={route('payroll')} active={route().current('payroll')} icon={WalletCards}>
                                Tabel Payroll
                            </SidebarLink>
                            <SidebarLink href={route('salary-components')} active={route().current('salary-components')} icon={Receipt}>
                                Komponen Gaji
                            </SidebarLink>
                            <SidebarLink href={route('performance-reviews')} active={route().current('performance-reviews')} icon={Star}>
                                Penilaian Kinerja (KPI)
                            </SidebarLink>
                            <SidebarLink href={route('okr')} active={route().current('okr')} icon={Target}>
                                Manajemen OKR
                            </SidebarLink>
                            <SidebarLink href={route('recruitment')} active={route().current('recruitment')} icon={Briefcase}>
                                Recruitment & ATS
                            </SidebarLink>
                            <SidebarLink href={route('work-schedules')} active={route().current('work-schedules')} icon={AlarmClock}>
                                Master Jadwal Kerja
                            </SidebarLink>
                            <SidebarLink href={route('work-schedules.roster')} active={route().current('work-schedules.roster')} icon={CalendarClock}>
                                Roster Shift Karyawan
                            </SidebarLink>
                            <SidebarLink href={route('resignations')} active={route().current('resignations')} icon={UserMinus}>
                                Offboarding & Pesangon
                            </SidebarLink>
                            <SidebarLink href={route('reports')} active={route().current('reports')} icon={BarChart3}>
                                Pusat Laporan
                            </SidebarLink>
                            <SidebarLink href={route('holidays')} active={route().current('holidays')} icon={Calendar}>
                                Hari Libur
                            </SidebarLink>
                            <SidebarLink href={route('settings')} active={route().current('settings')} icon={SettingsIcon}>
                                Pengaturan
                            </SidebarLink>
                            {user.role === 'admin' && (
                                <SidebarLink href={route('audit-logs')} active={route().current('audit-logs')} icon={Activity}>
                                    Audit Log
                                </SidebarLink>
                            )}
                        </>
                    )}

                    <SidebarGroup title="Pengajuan / Request" />
                    <SidebarLink href={route('leaves')} active={route().current('leaves')} icon={Coffee}>
                        Cuti
                    </SidebarLink>
                    <SidebarLink href={route('overtimes')} active={route().current('overtimes')} icon={Clock}>
                        Lembur
                    </SidebarLink>
                    <SidebarLink href={route('reimbursements')} active={route().current('reimbursements')} icon={Receipt}>
                        Klaim (Reimburse)
                    </SidebarLink>
                    <SidebarLink href={route('cash-advances')} active={route().current('cash-advances')} icon={Banknote}>
                        Kasbon Karyawan
                    </SidebarLink>
                    <SidebarLink href={route('loans')} active={route().current('loans')} icon={WalletCards}>
                        Pinjaman &amp; Cicilan
                    </SidebarLink>
                </div>
                
                {/* User Info Bottom */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate dark:text-gray-400 capitalize">{user.role}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content wrapper */}
            <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
                {/* Top Header */}
                <header className="flex items-center justify-between h-20 px-4 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800 sm:px-6 lg:px-8">
                    {/* Left: Mobile Menu Toggle & Title */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                        >
                            <Menu size={24} />
                        </button>
                        {header && (
                            <div className="hidden sm:block">
                                {header}
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-500 transition-colors rounded-full dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                            title="Toggle Theme"
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {/* Notifications */}
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="relative p-2 text-gray-500 transition-colors rounded-full dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none">
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="right" width="80" contentClasses="py-1 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifikasi</span>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllAsRead} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                                            Tandai dibaca
                                        </button>
                                    )}
                                </div>
                                <div className="overflow-y-auto max-h-80 custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-8 text-sm text-center text-gray-500 dark:text-gray-400">
                                            Belum ada notifikasi.
                                        </div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div 
                                                key={notif.id} 
                                                onClick={() => { if (!notif.read_at) markAsRead(notif.id); }}
                                                className={`px-4 py-3 border-b dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${notif.read_at ? 'opacity-70' : 'bg-blue-50/50 dark:bg-blue-900/20'}`}
                                            >
                                                <p className={`text-sm ${notif.read_at ? 'text-gray-700 dark:text-gray-300' : 'font-semibold text-gray-900 dark:text-white'}`}>
                                                    {notif.data.title}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                                    {notif.data.message}
                                                </p>
                                                <p className="mt-2 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                                                    {new Date(notif.created_at).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Dropdown.Content>
                        </Dropdown>
                        
                        {/* User Profile */}
                        <div className="relative ml-1">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center gap-2 p-1 pl-2 pr-3 transition-colors border border-transparent rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none">
                                        <div className="flex items-center justify-center w-8 h-8 text-sm font-medium text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="hidden text-sm font-medium text-gray-700 sm:block dark:text-gray-300">
                                            {user.name.split(' ')[0]}
                                        </span>
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content align="right" width="48">
                                    <Dropdown.Link href={route('profile.edit')} className="flex items-center gap-2 py-2.5 text-sm">
                                        <User size={16} />
                                        Profile
                                    </Dropdown.Link>
                                    <div className="border-t border-gray-100 dark:border-gray-700"></div>
                                    <Dropdown.Link href={route('logout')} method="post" as="button" className="flex items-center gap-2 py-2.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                                        <LogOut size={16} />
                                        Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </header>

                {/* Mobile Header Title */}
                {header && (
                    <div className="px-4 py-4 bg-white border-b border-gray-200 sm:hidden dark:bg-gray-900 dark:border-gray-800">
                        {header}
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 custom-scrollbar p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
            
            {/* Custom Scrollbar Styles for webkit */}
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.3);
                    border-radius: 20px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(75, 85, 99, 0.4);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(156, 163, 175, 0.5);
                }
            `}} />
        </div>
    );
}
