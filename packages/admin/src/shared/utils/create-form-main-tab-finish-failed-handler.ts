import type { FormInstance, FormProps } from 'antd';

import { FORM_SCROLL_TO_ERROR_OPTIONS } from './form-scroll-to-error-options';

/**
 * При ошибке валидации переключает на вкладку с полями формы и прокручивает к первому полю с ошибкой.
 * Удобно, когда ошибки возможны только на одной вкладке (ключ по умолчанию «1»).
 */
export const createFormMainTabFinishFailedHandler = (params: {
    form: FormInstance;
    mainTabKey?: string;
    resolveTabKey?: (namePath: (string | number)[]) => string;
    setActiveKey: (key: string) => void;
    upstream?: FormProps['onFinishFailed'];
    scrollDelayMs?: number;
}): NonNullable<FormProps['onFinishFailed']> => {
    const { form, mainTabKey = '1', resolveTabKey, setActiveKey, upstream, scrollDelayMs = 150 } = params;

    return (errorInfo) => {
        const sorted = [...(errorInfo.errorFields ?? [])].sort((a, b) =>
            JSON.stringify(a.name).localeCompare(JSON.stringify(b.name))
        );
        const first = sorted.find((field) => field.name?.length);
        const namePath = first?.name;

        if (namePath?.length) {
            setActiveKey(resolveTabKey?.(namePath) ?? mainTabKey);
            window.setTimeout(() => {
                void form.scrollToField(namePath, FORM_SCROLL_TO_ERROR_OPTIONS);
            }, scrollDelayMs);
        }

        upstream?.(errorInfo);
    };
};
