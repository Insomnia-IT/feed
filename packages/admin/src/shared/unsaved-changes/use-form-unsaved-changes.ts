import { useCallback, useEffect, useRef } from 'react';
import type { FormInstance, FormProps } from 'antd';
import { useWarnAboutChange } from '@refinedev/core';

import { serializeFormValues } from './serialize-form-values';

type UseFormUnsavedChangesParams = {
    form: FormInstance;
    formLoading: boolean;
    resetKey?: string | number;
};

export const useFormUnsavedChanges = ({ form, formLoading, resetKey }: UseFormUnsavedChangesParams) => {
    const { setWarnWhen } = useWarnAboutChange();
    const baselineRef = useRef<string | null>(null);
    const wasLoadingRef = useRef(formLoading);
    const prevResetKeyRef = useRef(resetKey);
    const initializedRef = useRef(false);

    const captureBaseline = useCallback(() => {
        baselineRef.current = serializeFormValues(form.getFieldsValue(true));
        setWarnWhen(false);
    }, [form, setWarnWhen]);

    useEffect(() => {
        const wasLoading = wasLoadingRef.current;
        wasLoadingRef.current = formLoading;

        if (formLoading) {
            return;
        }

        const finishedLoading = wasLoading && !formLoading;
        const resetKeyChanged = resetKey !== undefined && prevResetKeyRef.current !== resetKey;
        const needsInitialBaseline = !initializedRef.current;

        if (!finishedLoading && !resetKeyChanged && !needsInitialBaseline) {
            return;
        }

        initializedRef.current = true;
        if (resetKey !== undefined) {
            prevResetKeyRef.current = resetKey;
        }

        queueMicrotask(captureBaseline);
    }, [captureBaseline, formLoading, resetKey]);

    const syncWarnWhen = useCallback(() => {
        if (baselineRef.current === null) {
            return;
        }

        const current = serializeFormValues(form.getFieldsValue(true));
        setWarnWhen(current !== baselineRef.current);
    }, [form, setWarnWhen]);

    const clearWarnWhen = useCallback(() => {
        captureBaseline();
    }, [captureBaseline]);

    const wrapOnValuesChange = useCallback(
        (upstream?: FormProps['onValuesChange']): FormProps['onValuesChange'] =>
            (changedValues, allValues) => {
                upstream?.(changedValues, allValues);
                queueMicrotask(syncWarnWhen);
            },
        [syncWarnWhen]
    );

    return { wrapOnValuesChange, clearWarnWhen, syncWarnWhen };
};
