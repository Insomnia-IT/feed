import { describe, expect, it, vi } from 'vitest';

import {
    getActiveVolTabScrollContainer,
    scrollFormFieldInVolTabPane
} from './scroll-form-field-in-vol-tab-pane';
import { scrollElementIntoContainer } from './scroll-element-into-container';

vi.mock('./scroll-element-into-container', () => ({
    scrollElementIntoContainer: vi.fn()
}));

describe('getActiveVolTabScrollContainer', () => {
    it('finds the global vol tab pane scroll element', () => {
        document.body.innerHTML = `
            <div class="ant-tabs-tabpane-active">
                <div class="vol-tab-pane-scroll-wrap">
                    <div class="vol-tab-pane-scroll" data-testid="scroll"></div>
                </div>
            </div>
        `;

        expect(getActiveVolTabScrollContainer()?.dataset.testid).toBe('scroll');
    });
});

describe('scrollFormFieldInVolTabPane', () => {
    it('scrolls to the form item with aria-invalid control when field instance is missing', () => {
        const container = document.createElement('div');
        container.getBoundingClientRect = () => ({ top: 0, height: 400 }) as DOMRect;
        container.scrollTo = vi.fn();

        const formItem = document.createElement('div');
        formItem.className = 'ant-form-item ant-form-item-has-error';
        const trigger = document.createElement('button');
        trigger.setAttribute('aria-invalid', 'true');
        formItem.append(trigger);
        container.append(formItem);

        const scrolled = scrollFormFieldInVolTabPane({
            container,
            form: {
                getFieldInstance: () => null
            } as never,
            namePath: ['arrivals', 0, 'departure_date']
        });

        expect(scrolled).toBe(true);
        expect(scrollElementIntoContainer).toHaveBeenCalledWith({ container, element: formItem });
    });
});
