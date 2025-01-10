import React from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type: ToastType;
}

interface ToastVariant {
    base: string;
    icon: string;
}

const variants: Record<ToastType, ToastVariant> = {
    success: {
        base: 'bg-green-800 border-green-900 text-green-50',
        icon: '✓',
    },
    error: {
        base: 'bg-red-800 border-red-900 text-red-50',
        icon: '✕',
    },
    info: {
        base: 'bg-blue-800 border-blue-900 text-blue-50',
        icon: 'ℹ',
    },
    warning: {
        base: 'bg-yellow-800 border-yellow-900 text-yellow-50',
        icon: '⚠',
    },
};

const Toast: React.FC<ToastProps> = ({ message, type }) => {
    const { base, icon } = variants[type] || variants.info;

    return (
        <div className={`${base} flex items-center rounded-md border px-3 py-2 shadow-lg`}>
            <span className="mr-2 text-sm">{icon}</span>
            <p className="text-sm font-medium">{message}</p>
        </div>
    );
};

export type { ToastType };
export default Toast;
