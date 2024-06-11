import { useCallback, useEffect, useState } from 'react';

import type { Form } from '../feed-anon-group-card';

type ErrorRecord = Record<string, string>;

export const useValid = (form: Form) => {
    const [valid, setValid] = useState(true);
    const [errors, setErrors] = useState<ErrorRecord>({});
    const [mode, setMode] = useState<'onChange' | 'manual'>('manual');

    const validate = useCallback(() => {
        let valid = true;
        const errors: ErrorRecord = {};

        if (+form.meat + +form.vegan < 2) {
            valid = false;
            errors.counts = 'Запишите количество порций (>1)';
        }

        setValid(valid);
        setErrors(errors);

        if (mode === 'manual') {
            setMode('onChange');
        }

        return { valid, errors };
    }, [form, mode]);

    useEffect(() => {
        if (mode === 'onChange') {
            validate();
        }
    }, [form, mode, validate]);

    return { valid, errors, validate };
};
