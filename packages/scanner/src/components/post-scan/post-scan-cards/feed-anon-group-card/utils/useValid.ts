import { useCallback, useMemo, useState } from 'react';

import type { Form } from '../feed-anon-group-card';

type ErrorRecord = Record<string, string>;

export const useValid = (form: Form) => {
    const [mode, setMode] = useState<'onChange' | 'manual'>('manual');

    const validationResult = useMemo(() => {
        let valid = true;
        const errors: ErrorRecord = {};

        if (+form.meat + +form.vegan < 2) {
            valid = false;
            errors.counts = 'Запишите количество порций (>1)';
        }

        return { valid, errors };
    }, [form]);

    const validate = useCallback(() => {
        if (mode === 'manual') {
            setMode('onChange');
        }

        return validationResult;
    }, [mode, validationResult]);

    const valid = validationResult.valid;
    const errors = mode === 'onChange' ? validationResult.errors : {};
    return { valid, errors, validate };
};
