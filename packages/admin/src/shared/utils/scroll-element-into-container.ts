export function scrollElementIntoContainer(params: {
    container: HTMLElement;
    element: HTMLElement;
    behavior?: ScrollBehavior;
    padding?: number;
}): void {
    const { container, element, behavior = 'smooth', padding = 24 } = params;
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const elementOffsetTop = elementRect.top - containerRect.top + container.scrollTop;
    const centeredTop = elementOffsetTop - (container.clientHeight - elementRect.height) / 2;
    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);

    container.scrollTo({
        top: Math.max(0, Math.min(centeredTop - padding, maxScrollTop)),
        behavior
    });
}
