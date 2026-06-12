import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type VolunteerFormReadinessContextValue = {
    setGate: (key: string, ready: boolean) => void;
    allGatesReady: boolean;
    hasRegisteredGates: boolean;
};

const VolunteerFormReadinessContext = createContext<VolunteerFormReadinessContextValue | null>(null);

export const VolunteerFormReadinessProvider = ({ children }: { children: ReactNode }) => {
    const [gates, setGates] = useState<Record<string, boolean>>({});

    const setGate = useCallback((key: string, ready: boolean) => {
        setGates((previous) => {
            if (previous[key] === ready) {
                return previous;
            }

            return { ...previous, [key]: ready };
        });
    }, []);

    const gateValues = Object.values(gates);
    const hasRegisteredGates = gateValues.length > 0;
    const allGatesReady = hasRegisteredGates && gateValues.every(Boolean);

    const value = useMemo(
        () => ({
            setGate,
            allGatesReady,
            hasRegisteredGates
        }),
        [allGatesReady, hasRegisteredGates, setGate]
    );

    return <VolunteerFormReadinessContext.Provider value={value}>{children}</VolunteerFormReadinessContext.Provider>;
};

export const useVolunteerFormReadinessContext = () => {
    const context = useContext(VolunteerFormReadinessContext);

    if (!context) {
        throw new Error('useVolunteerFormReadinessContext must be used within VolunteerFormReadinessProvider');
    }

    return context;
};
