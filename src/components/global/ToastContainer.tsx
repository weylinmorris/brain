import React from 'react';
import Toast, { ToastType } from './Toast';

interface ToastData {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContainerProps {
    toasts: ToastData[];
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
    return (
        <div className="fixed right-4 top-4 z-50 space-y-4">
            {toasts.map((toast) => (
                <div key={toast.id} className="animate-fade-in-down">
                    <Toast {...toast} />
                </div>
            ))}
        </div>
    );
};

export type { ToastData };
export default ToastContainer;
