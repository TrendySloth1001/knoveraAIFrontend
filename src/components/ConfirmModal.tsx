import { useAlert } from '../context/AlertContext';
import { AlertTriangle } from 'lucide-react';
import './Alert.css';

export function ConfirmModal() {
    const { confirm } = useAlert();

    if (!confirm.isOpen) return null;

    return (
        <div className="confirm-overlay">
            <div className="confirm-modal">
                <div className="confirm-icon">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="confirm-title">Are you sure?</h3>
                <p className="confirm-message">{confirm.message}</p>
                <div className="confirm-actions">
                    <button className="confirm-btn cancel" onClick={confirm.onCancel}>
                        Cancel
                    </button>
                    <button className="confirm-btn confirm" onClick={confirm.onConfirm}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
