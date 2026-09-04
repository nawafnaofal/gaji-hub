import { Wallet } from 'lucide-react';

export default function ApplicationLogo({ className = "w-8 h-8", ...props }) {
    return (
        <div 
            className={`rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 ${className}`}
            {...props}
        >
            <Wallet className="w-5/8 h-5/8 max-w-[65%] max-h-[65%]" />
        </div>
    );
}
