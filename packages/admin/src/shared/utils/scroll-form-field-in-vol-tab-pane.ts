import type { FormInstance } from 'antd';

import { scrollElementIntoContainer } from './scroll-element-into-container';

const ACTIVE_VOL_TAB_SCROLL_SELECTOR = '.ant-tabs-tabpane-active .vol-tab-pane-scroll-wrap .scroll';

function findFormItemElement(form: FormInstance, namePath: (string | number)[]): HTMLElement | null {
    const fieldInstance = form.getFieldInstance(namePath) as { nativeElement?: HTMLElement } | HTMLElement | null;

    if (!fieldInstance) {
        return null;
    }

    const domNode =
        typeof fieldInstance === 'object' && fieldInstance !== null && 'nativeElement' in fieldInstance
            ? fieldInstance.nativeElement
            : (fieldInstance as HTMLElement);

    return domNode?.closest?.('.ant-form-item') ?? null;
}

function pickTopmostErrorNamePath(params: {
    container: HTMLElement;
    errorFields: Array<{ name?: (string | number)[] }>;
    form: FormInstance;
}): (string | number)[] | undefined {
    let topmost: { namePath: (string | number)[]; top: number } | null = null;

    for (const field of params.errorFields) {
        const namePath = field.name;
        if (!namePath?.length) {
            continue;
        }

        const formItem = findFormItemElement(params.form, namePath);
        if (!formItem || !params.container.contains(formItem)) {
            continue;
        }

        const top = formItem.getBoundingClientRect().top;
        if (!topmost || top < topmost.top) {
            topmost = { namePath, top };
        }
    }

    return topmost?.namePath;
}

export function scrollFormFieldInVolTabPane(params: {
    container: HTMLElement;
    form: FormInstance;
    namePath?: (string | number)[];
    errorFields?: Array<{ name?: (string | number)[] }>;
}): boolean {
    const resolvedNamePath =
        params.namePath ??
        (params.errorFields ? pickTopmostErrorNamePath({ ...params, container: params.container }) : undefined);

    const formItem =
        (resolvedNamePath ? findFormItemElement(params.form, resolvedNamePath) : null) ??
        params.container.querySelector<HTMLElement>('.ant-form-item-has-error');

    if (!formItem) {
        return false;
    }

    scrollElementIntoContainer({ container: params.container, element: formItem });
    return true;
}

export function scrollToFormErrorInVolTabPane(params: {
    form: FormInstance;
    namePath?: (string | number)[];
    errorFields?: Array<{ name?: (string | number)[] }>;
    maxAttempts?: number;
    intervalMs?: number;
}): void {
    const { form, namePath, errorFields, maxAttempts = 12, intervalMs = 50 } = params;
    let attempt = 0;

    const tryScroll = () => {
        const container = document.querySelector<HTMLElement>(ACTIVE_VOL_TAB_SCROLL_SELECTOR);
        if (!container) {
            return;
        }

        const scrolled = scrollFormFieldInVolTabPane({ container, form, namePath, errorFields });

        if (scrolled || attempt >= maxAttempts) {
            return;
        }

        attempt += 1;
        window.setTimeout(tryScroll, intervalMs);
    };

    tryScroll();
}
