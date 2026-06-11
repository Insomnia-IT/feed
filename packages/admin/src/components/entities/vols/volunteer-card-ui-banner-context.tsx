import { type FormInstance } from 'antd';
import { createContext, type ReactNode, useContext, useEffect, useRef } from 'react';

type VolunteerCardUiBannerFormContextValue = {
    formRef: { current: FormInstance | undefined };
};

export const VolunteerCardUiBannerFormContext = createContext<VolunteerCardUiBannerFormContextValue | null>(null);

export const VolunteerCardUiBannerProvider = ({ children }: { children: ReactNode }) => {
    const formRef = useRef<FormInstance | undefined>(undefined);

    return (
        <VolunteerCardUiBannerFormContext.Provider value={{ formRef }}>
            {children}
        </VolunteerCardUiBannerFormContext.Provider>
    );
};

export const useRegisterVolunteerCardUiBannerForm = (form: FormInstance) => {
    const context = useContext(VolunteerCardUiBannerFormContext);

    useEffect(() => {
        if (!context) {
            return;
        }

        context.formRef.current = form;

        return () => {
            if (context.formRef.current === form) {
                context.formRef.current = undefined;
            }
        };
    }, [context, form]);
};
