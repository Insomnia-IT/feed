import type { FormInstance, FormProps } from 'antd';

import { FORM_SCROLL_TO_ERROR_OPTIONS } from './form-scroll-to-error-options';
import { scrollToFormErrorInVolTabPane } from './scroll-form-field-in-vol-tab-pane';

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
    scrollInVolTabPane?: boolean;
}): NonNullable<FormProps['onFinishFailed']> => {
    const {
        form,
        mainTabKey = '1',
        resolveTabKey,
        setActiveKey,
        upstream,
        scrollDelayMs = 150,
        scrollInVolTabPane = false
    } = params;

    return (errorInfo) => {
        const errorFields = errorInfo.errorFields ?? [];
        const namePath = errorFields.find((field) => field.name?.length)?.name;

        if (namePath?.length) {
            setActiveKey(resolveTabKey?.(namePath) ?? mainTabKey);
        }

        window.setTimeout(() => {
            if (namePath?.length) {
                void form.scrollToField(namePath, FORM_SCROLL_TO_ERROR_OPTIONS);
            }

            if (scrollInVolTabPane) {
                scrollToFormErrorInVolTabPane({ form, namePath, errorFields });
            }
        }, scrollDelayMs);

        upstream?.(errorInfo);
    };
};
