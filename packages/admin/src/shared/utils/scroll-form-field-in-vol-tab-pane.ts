import type { FormInstance } from 'antd';

import { scrollElementIntoContainer } from './scroll-element-into-container';

const ACTIVE_VOL_TAB_SCROLL_SELECTOR = '.ant-tabs-tabpane-active .vol-tab-pane-scroll';

function toNamePathKey(namePath: (string | number)[]): string {
    return namePath.map(String).join('_');
}

export function getActiveVolTabScrollContainer(): HTMLElement | null {
    return (
        document.querySelector<HTMLElement>(ACTIVE_VOL_TAB_SCROLL_SELECTOR) ??
        document.querySelector<HTMLElement>('.ant-tabs-tabpane-active .vol-tab-pane-scroll-wrap > :first-child')
    );
}

function resolveFieldDomNode(fieldInstance: unknown): HTMLElement | null {
    if (!fieldInstance) {
        return null;
    }

    const domNode =
        typeof fieldInstance === 'object' && fieldInstance !== null && 'nativeElement' in fieldInstance
            ? (fieldInstance as { nativeElement?: HTMLElement }).nativeElement
            : (fieldInstance as HTMLElement);

    return domNode ?? null;
}

function findFormItemByNamePath(params: {
    container: HTMLElement;
    form: FormInstance;
    namePath: (string | number)[];
}): HTMLElement | null {
    const { container, form, namePath } = params;
    const fieldDomNode = resolveFieldDomNode(form.getFieldInstance(namePath));

    if (fieldDomNode) {
        const formItem = fieldDomNode.closest?.('.ant-form-item');
        if (formItem instanceof HTMLElement && container.contains(formItem)) {
            return formItem;
        }
    }

    const nameKey = toNamePathKey(namePath);

    for (const formItem of container.querySelectorAll<HTMLElement>('.ant-form-item')) {
        for (const control of formItem.querySelectorAll<HTMLElement>('[id]')) {
            const controlId = control.id;
            if (controlId === nameKey || controlId.endsWith(`_${nameKey}`)) {
                return formItem;
            }
        }

        const labelFor = formItem.querySelector<HTMLLabelElement>('label[for]')?.getAttribute('for');
        if (labelFor && (labelFor === nameKey || labelFor.endsWith(`_${nameKey}`))) {
            return formItem;
        }
    }

    return null;
}

function findErrorFormItems(container: HTMLElement): HTMLElement[] {
    const items = new Set<HTMLElement>();

    container.querySelectorAll<HTMLElement>('.ant-form-item-has-error').forEach((item) => items.add(item));
    container.querySelectorAll<HTMLElement>('[aria-invalid="true"]').forEach((control) => {
        const formItem = control.closest('.ant-form-item');
        if (formItem instanceof HTMLElement) {
            items.add(formItem);
        }
    });

    return [...items];
}

function pickTopmostFormItem(items: HTMLElement[]): HTMLElement | undefined {
    let topmost: { element: HTMLElement; top: number } | undefined;

    for (const element of items) {
        const top = element.getBoundingClientRect().top;
        if (!topmost || top < topmost.top) {
            topmost = { element, top };
        }
    }

    return topmost?.element;
}

function resolveErrorFormItem(params: {
    container: HTMLElement;
    errorFields?: Array<{ name?: (string | number)[] }>;
    form: FormInstance;
    namePath?: (string | number)[];
}): HTMLElement | null {
    const { container, errorFields, form, namePath } = params;
    const candidateNamePaths = [
        ...(namePath ? [namePath] : []),
        ...(errorFields?.map((field) => field.name).filter((fieldName): fieldName is (string | number)[] =>
            Boolean(fieldName?.length)
        ) ?? [])
    ];

    const matchedItems = candidateNamePaths
        .map((candidateNamePath) => findFormItemByNamePath({ container, form, namePath: candidateNamePath }))
        .filter((item): item is HTMLElement => item !== null);

    if (matchedItems.length === 1) {
        return matchedItems[0];
    }

    if (matchedItems.length > 1) {
        return pickTopmostFormItem(matchedItems) ?? null;
    }

    const errorItems = findErrorFormItems(container);
    if (errorItems.length === 0) {
        return null;
    }

    return pickTopmostFormItem(errorItems) ?? errorItems[0] ?? null;
}

export function scrollFormFieldInVolTabPane(params: {
    container: HTMLElement;
    form: FormInstance;
    namePath?: (string | number)[];
    errorFields?: Array<{ name?: (string | number)[] }>;
}): boolean {
    const formItem = resolveErrorFormItem(params);

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
    const { form, namePath, errorFields, maxAttempts = 16, intervalMs = 50 } = params;
    let attempt = 0;

    const tryScroll = () => {
        const container = getActiveVolTabScrollContainer();
        if (!container) {
            if (attempt < maxAttempts) {
                attempt += 1;
                window.setTimeout(tryScroll, intervalMs);
            }
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
