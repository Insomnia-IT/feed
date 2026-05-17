import type { FormInstance, FormProps } from 'antd';

/**
 * При ошибке валидации переключает на вкладку с полями формы и прокручивает к первому полю с ошибкой.
 * Удобно, когда ошибки возможны только на одной вкладке (ключ по умолчанию «1»).
 */
export const createFormMainTabFinishFailedHandler = (params: {
    form: FormInstance;
    mainTabKey?: string;
    setActiveKey: (key: string) => void;
    upstream?: FormProps['onFinishFailed'];
}): NonNullable<FormProps['onFinishFailed']> => {
    const { form, mainTabKey = '1', setActiveKey, upstream } = params;

    return (errorInfo) => {
        const sorted = [...(errorInfo.errorFields ?? [])].sort((a, b) =>
            JSON.stringify(a.name).localeCompare(JSON.stringify(b.name))
        );
        const first = sorted.find((field) => field.name?.length);
        const namePath = first?.name;

        if (namePath?.length) {
            setActiveKey(mainTabKey);
            window.setTimeout(() => {
                void form.scrollToField(namePath, { behavior: 'smooth', block: 'nearest', focus: true });
            }, 100);
        }

        upstream?.(errorInfo);
    };
};
