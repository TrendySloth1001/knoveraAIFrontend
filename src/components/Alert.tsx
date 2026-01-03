import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import './Alert.css';

export function Alert() {
    const { alert, hideAlert } = useAlert();

    const getIcon = () => {
        switch (alert.type) {
            case 'success': return <CheckCircle2 size={20} />;
            case 'error': return <AlertCircle size={20} />;
            default: return <Info size={20} />;
        }
    };

    return (
        <div className={`alert-container ${alert.isVisible ? 'visible' : ''} alert-${alert.type}`}>
            <div className={`alert-content`}>
                <div className="alert-icon">
                    {getIcon()}
                </div>
                <div className="alert-message">
                    {alert.message}
                </div>
                <button className="alert-close" onClick={hideAlert}>
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
