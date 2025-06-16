import React, { createContext, useContext, useState, useCallback, PropsWithChildren } from 'react';
import { Dayjs } from 'dayjs';

type Context = {
    date?: Dayjs;
    dateType?: 'start' | 'end';
    setDate: (date: Dayjs, dateType: 'start' | 'end') => void;
    clearDate: () => void;
};

const ArrivalDates = createContext<Context | null>(null);

export const ArrivalDatesProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [date, setDate] = useState<Dayjs | undefined>(undefined);
    const [dateType, setDateType] = useState<'start' | 'end' | undefined>(undefined);

    const setDateOuter = useCallback((date: Dayjs, dateType: 'start' | 'end') => {
        setDate(date);
        setDateType(dateType);
    }, []);
    const clearDate = useCallback(() => {
        setDate(undefined);
        setDateType(undefined);
    }, []);

    return (
        <ArrivalDates.Provider value={{ date, dateType, setDate: setDateOuter, clearDate }}>
            {children}
        </ArrivalDates.Provider>
    );
};

export const useArrivalDates = () => {
    const context = useContext(ArrivalDates);

    if (!context) {
        throw new Error('ArrivalDates must be called from within the ArrivalDatesProvider');
    }

    return context;
};
