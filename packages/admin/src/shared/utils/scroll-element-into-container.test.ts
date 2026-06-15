import { describe, expect, it, vi } from 'vitest';

import { scrollElementIntoContainer } from './scroll-element-into-container';

describe('scrollElementIntoContainer', () => {
    it('centers the element inside the scroll container', () => {
        const container = {
            scrollTop: 0,
            scrollHeight: 1000,
            clientHeight: 400,
            getBoundingClientRect: () => ({ top: 100, height: 400 }),
            scrollTo: vi.fn()
        } as unknown as HTMLElement;

        const element = {
            getBoundingClientRect: () => ({ top: 500, height: 40 })
        } as unknown as HTMLElement;

        scrollElementIntoContainer({ container, element, behavior: 'auto', padding: 0 });

        expect(container.scrollTo).toHaveBeenCalledWith({
            top: 220,
            behavior: 'auto'
        });
    });
});
