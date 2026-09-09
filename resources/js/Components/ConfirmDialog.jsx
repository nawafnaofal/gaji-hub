import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', variant = 'danger' }) {
    const confirmRef = useRef(null);

    useEffect(() => {
        if (open && confirmRef.current) {
            confirmRef.current.focus();
        }

        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape' && open) onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onClose]);

    if (!open) return null;

    const variantStyles = {
        danger: {
            icon: 'text-red-400 bg-red-400/10',
            button: 'bg-red-500 hover:bg-red-600 focus:ring-red-500/50',
        },
        warning: {
            icon: 'text-amber-400 bg-amber-400/10',
            button: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/50',
        },
        info: {
            icon: 'text-blue-400 bg-blue-400/10',
            button: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500/50',
        },
    };

    const style = variantStyles[variant] || variantStyles.danger;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Dialog */}
            <div className="relative w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="p-6">
                    {/* Icon */}
                    <div className={`mx-auto w-12 h-12 flex items-center justify-center rounded-full ${style.icon} mb-4`}>
                        <AlertTriangle size={24} />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-white text-center mb-2">
                        {title || 'Konfirmasi'}
                    </h3>

                    {/* Message */}
                    <p className="text-sm text-gray-400 text-center mb-6">
                        {message || 'Apakah Anda yakin ingin melanjutkan tindakan ini?'}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            ref={confirmRef}
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors focus:ring-2 focus:outline-none ${style.button}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
