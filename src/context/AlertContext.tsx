import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type AlertType = 'success' | 'error' | 'info';

interface AlertState {
    message: string;
    type: AlertType;
    isVisible: boolean;
}

interface ConfirmState {
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

interface AlertContextType {
    alert: AlertState;
    showAlert: (message: string, type?: AlertType) => void;
    hideAlert: () => void;
    confirm: ConfirmState;
    showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
    hideConfirm: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
    const [alert, setAlert] = useState<AlertState>({
        message: '',
        type: 'info',
        isVisible: false,
    });

    const [confirm, setConfirm] = useState<ConfirmState>({
        isOpen: false,
        message: '',
        onConfirm: () => { },
        onCancel: () => { },
    });

    const hideAlert = useCallback(() => {
        setAlert(prev => ({ ...prev, isVisible: false }));
    }, []);

    const showAlert = useCallback((message: string, type: AlertType = 'info') => {
        setAlert({ message, type, isVisible: true });
        setTimeout(() => {
            hideAlert();
        }, 3000);
    }, [hideAlert]);

    const hideConfirm = useCallback(() => {
        setConfirm(prev => ({ ...prev, isOpen: false }));
    }, []);

    const showConfirm = useCallback((message: string, onConfirm: () => void, onCancel: () => void = () => { }) => {
        setConfirm({
            isOpen: true,
            message,
            onConfirm: () => {
                onConfirm();
                hideConfirm();
            },
            onCancel: () => {
                onCancel();
                hideConfirm();
            },
        });
    }, [hideConfirm]);

    return (
        <AlertContext.Provider value={{ alert, showAlert, hideAlert, confirm, showConfirm, hideConfirm }}>
            {children}
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}
