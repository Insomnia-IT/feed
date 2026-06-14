import type { FormProps } from 'antd';

/** Параметры прокрутки Ant Design Form к полю с ошибкой (scroll-into-view-if-needed). */
export const FORM_SCROLL_TO_ERROR_OPTIONS = {
    behavior: 'smooth',
    block: 'center',
    focus: true,
    scrollMode: 'always'
} as const satisfies NonNullable<FormProps['scrollToFirstError']> & Record<string, unknown>;
