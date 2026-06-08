import { useCallback, useEffect, useRef } from 'react';
import type { FormInstance, FormProps } from 'antd';
import { useWarnAboutChange } from '@refinedev/core';

import { serializeFormValues } from './serialize-form-values';

const BASELINE_SETTLE_MS = 300;

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
    const isSettlingRef = useRef(false);
    const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearSettleTimer = useCallback(() => {
        if (settleTimerRef.current !== null) {
            window.clearTimeout(settleTimerRef.current);
            settleTimerRef.current = null;
        }
    }, []);

    const captureBaseline = useCallback(() => {
        clearSettleTimer();
        isSettlingRef.current = false;
        baselineRef.current = serializeFormValues(form.getFieldsValue(true));
        setWarnWhen(false);
    }, [clearSettleTimer, form, setWarnWhen]);

    const scheduleBaselineCapture = useCallback(() => {
        isSettlingRef.current = true;
        setWarnWhen(false);
        clearSettleTimer();

        settleTimerRef.current = window.setTimeout(() => {
            settleTimerRef.current = null;
            captureBaseline();
        }, BASELINE_SETTLE_MS);
    }, [captureBaseline, clearSettleTimer, setWarnWhen]);

    useEffect(() => {
        const wasLoading = wasLoadingRef.current;
        wasLoadingRef.current = formLoading;

        if (formLoading) {
            isSettlingRef.current = true;
            baselineRef.current = null;
            clearSettleTimer();
            setWarnWhen(false);
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

        scheduleBaselineCapture();

        return clearSettleTimer;
    }, [clearSettleTimer, formLoading, resetKey, scheduleBaselineCapture, setWarnWhen]);

    const syncWarnWhen = useCallback(() => {
        if (isSettlingRef.current || baselineRef.current === null) {
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

                if (isSettlingRef.current) {
                    scheduleBaselineCapture();
                    return;
                }

                queueMicrotask(syncWarnWhen);
            },
        [scheduleBaselineCapture, syncWarnWhen]
    );

    return { wrapOnValuesChange, clearWarnWhen, syncWarnWhen };
};
