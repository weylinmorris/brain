import Toast from "@/components/global/Toast.js";

const ToastContainer = ({ toasts }) => {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-4">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className="animate-fade-in-down"
                >
                    <Toast {...toast} />
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;