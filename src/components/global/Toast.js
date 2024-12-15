const Toast = ({ message, type }) => {
    const variants = {
        success: {
            base: 'bg-green-800 border-green-900 text-green-50',
            icon: '✓'
        },
        error: {
            base: 'bg-red-800 border-red-900 text-red-50',
            icon: '✕'
        },
        info: {
            base: 'bg-blue-800 border-blue-900 text-blue-50',
            icon: 'ℹ'
        },
        warning: {
            base: 'bg-yellow-800 border-yellow-900 text-yellow-50',
            icon: '⚠'
        }
    };

    const { base, icon } = variants[type] || variants.info;

    return (
        <div className={`${base} px-3 py-2 rounded-md border flex items-center shadow-lg`}>
            <span className="mr-2 text-sm">{icon}</span>
            <p className="text-sm font-medium">{message}</p>
        </div>
    );
};

export default Toast;
