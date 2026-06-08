import { useCallback, useEffect, useRef } from 'react';
import type { FormInstance, FormProps } from 'antd';
import { useWarnAboutChange } from '@refinedev/core';

import { serializeFormValues } from './serialize-form-values';

type UseFormUnsavedChangesParams = {
    form: FormInstance;
    formLoading: boolean;
    isReady?: boolean;
    resetKey?: string | number;
};

export const useFormUnsavedChanges = ({ form, formLoading, isReady = true, resetKey }: UseFormUnsavedChangesParams) => {
    const { setWarnWhen } = useWarnAboutChange();
    const baselineRef = useRef<string | null>(null);
    const wasLoadingRef = useRef(formLoading);
    const prevResetKeyRef = useRef(resetKey);
    const prevReadyRef = useRef(isReady);
    const isReadyRef = useRef(isReady);

    useEffect(() => {
        isReadyRef.current = isReady;
    }, [isReady]);

    const captureBaseline = useCallback(() => {
        baselineRef.current = serializeFormValues(form.getFieldsValue(true));
        setWarnWhen(false);
    }, [form, setWarnWhen]);

    useEffect(() => {
        const wasLoading = wasLoadingRef.current;
        const wasReady = prevReadyRef.current;
        wasLoadingRef.current = formLoading;
        prevReadyRef.current = isReady;

        if (formLoading || !isReady) {
            baselineRef.current = null;
            setWarnWhen(false);
            return;
        }

        const finishedLoading = wasLoading && !formLoading;
        const becameReady = !wasReady && isReady;
        const resetKeyChanged = resetKey !== undefined && prevResetKeyRef.current !== resetKey;

        if (resetKeyChanged && resetKey !== undefined) {
            prevResetKeyRef.current = resetKey;
        }

        if (finishedLoading || becameReady || resetKeyChanged || baselineRef.current === null) {
            queueMicrotask(captureBaseline);
        }
    }, [captureBaseline, formLoading, isReady, resetKey, setWarnWhen]);

    const syncWarnWhen = useCallback(() => {
        if (!isReadyRef.current || baselineRef.current === null) {
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

                if (!isReadyRef.current) {
                    return;
                }

                queueMicrotask(syncWarnWhen);
            },
        [syncWarnWhen]
    );

    return { wrapOnValuesChange, clearWarnWhen, syncWarnWhen };
};
