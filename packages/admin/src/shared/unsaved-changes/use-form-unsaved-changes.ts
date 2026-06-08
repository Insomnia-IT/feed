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
    const isSettlingRef = useRef(false);
    const settleRafRef = useRef<number | null>(null);

    useEffect(() => {
        isReadyRef.current = isReady;
    }, [isReady]);

    const cancelSettleSchedule = useCallback(() => {
        if (settleRafRef.current !== null) {
            cancelAnimationFrame(settleRafRef.current);
            settleRafRef.current = null;
        }
    }, []);

    const captureBaseline = useCallback(() => {
        cancelSettleSchedule();
        isSettlingRef.current = false;
        baselineRef.current = serializeFormValues(form.getFieldsValue(true));
        setWarnWhen(false);
    }, [cancelSettleSchedule, form, setWarnWhen]);

    const scheduleStableBaselineCapture = useCallback(() => {
        isSettlingRef.current = true;
        setWarnWhen(false);
        cancelSettleSchedule();

        settleRafRef.current = requestAnimationFrame(() => {
            settleRafRef.current = requestAnimationFrame(() => {
                settleRafRef.current = null;
                isSettlingRef.current = false;

                if (!isReadyRef.current) {
                    return;
                }

                captureBaseline();
            });
        });
    }, [cancelSettleSchedule, captureBaseline, setWarnWhen]);

    useEffect(() => {
        const wasLoading = wasLoadingRef.current;
        const wasReady = prevReadyRef.current;
        wasLoadingRef.current = formLoading;
        prevReadyRef.current = isReady;

        if (formLoading || !isReady) {
            cancelSettleSchedule();
            isSettlingRef.current = false;
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
            scheduleStableBaselineCapture();
        }
    }, [cancelSettleSchedule, formLoading, isReady, resetKey, scheduleStableBaselineCapture, setWarnWhen]);

    useEffect(() => cancelSettleSchedule, [cancelSettleSchedule]);

    const syncWarnWhen = useCallback(() => {
        if (!isReadyRef.current || baselineRef.current === null || isSettlingRef.current) {
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

                if (isSettlingRef.current) {
                    scheduleStableBaselineCapture();
                    return;
                }

                queueMicrotask(syncWarnWhen);
            },
        [scheduleStableBaselineCapture, syncWarnWhen]
    );

    return { wrapOnValuesChange, clearWarnWhen, syncWarnWhen };
};
