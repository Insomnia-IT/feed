import { useEffect } from 'react';

import { useVolunteerFormReadinessContext } from './volunteer-form-readiness-context';

export const useVolunteerFormReadinessGate = (key: string, ready: boolean) => {
    const { setGate } = useVolunteerFormReadinessContext();

    useEffect(() => {
        setGate(key, ready);
    }, [key, ready, setGate]);

    useEffect(() => {
        return () => {
            setGate(key, false);
        };
    }, [key, setGate]);
};
