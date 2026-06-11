import { type FormInstance } from 'antd';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

type VolunteerCardUiBannerFormContextValue = {
    registerForm: (form: FormInstance | undefined) => void;
    getForm: () => FormInstance | undefined;
};

export const VolunteerCardUiBannerFormContext = createContext<VolunteerCardUiBannerFormContextValue | null>(null);

export const VolunteerCardUiBannerProvider = ({ children }: { children: ReactNode }) => {
    const formRef = useRef<FormInstance | undefined>(undefined);

    const registerForm = useCallback((form: FormInstance | undefined) => {
        formRef.current = form;
    }, []);

    const getForm = useCallback(() => formRef.current, []);

    const value = useMemo(
        () => ({
            registerForm,
            getForm
        }),
        [registerForm, getForm]
    );

    return (
        <VolunteerCardUiBannerFormContext.Provider value={value}>{children}</VolunteerCardUiBannerFormContext.Provider>
    );
};

export const useRegisterVolunteerCardUiBannerForm = (form: FormInstance) => {
    const context = useContext(VolunteerCardUiBannerFormContext);

    useEffect(() => {
        if (!context) {
            return;
        }

        context.registerForm(form);

        return () => {
            if (context.getForm() === form) {
                context.registerForm(undefined);
            }
        };
    }, [context, form]);
};
