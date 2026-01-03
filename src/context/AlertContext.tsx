import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type AlertType = 'success' | 'error' | 'info';

interface AlertState {
    message: string;
    type: AlertType;
    isVisible: boolean;
}

interface AlertContextType {
    alert: AlertState;
    showAlert: (message: string, type?: AlertType) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
    const [alert, setAlert] = useState<AlertState>({
        message: '',
        type: 'info',
        isVisible: false,
    });

    const hideAlert = useCallback(() => {
        setAlert(prev => ({ ...prev, isVisible: false }));
    }, []);

    const showAlert = useCallback((message: string, type: AlertType = 'info') => {
        setAlert({ message, type, isVisible: true });
        // Auto-hide after 3 seconds
        setTimeout(() => {
            hideAlert();
        }, 3000);
    }, [hideAlert]);

    return (
        <AlertContext.Provider value={{ alert, showAlert, hideAlert }}>
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
