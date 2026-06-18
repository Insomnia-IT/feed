import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import styles from './vol-tab-pane-scroll.module.css';

const SCROLLBAR_GAP_ABOVE_SAVE_PX = 24;
const MIN_THUMB_HEIGHT_PX = 32;
const FALLBACK_BOTTOM_RESERVE_PX = 88;

type ScrollbarMetrics = {
    thumbHeight: number;
    thumbTop: number;
    show: boolean;
};

type RailBox = {
    top: number;
    height: number;
};

function getScrollbarBottomReservePx(): number {
    const saveButton = document.querySelector<HTMLElement>('.floatingSaveButton');

    if (!saveButton) {
        return FALLBACK_BOTTOM_RESERVE_PX;
    }

    const { display, visibility } = getComputedStyle(saveButton);

    if (display === 'none' || visibility === 'hidden') {
        return FALLBACK_BOTTOM_RESERVE_PX;
    }

    const { top, height } = saveButton.getBoundingClientRect();

    if (height <= 0) {
        return FALLBACK_BOTTOM_RESERVE_PX;
    }

    return Math.max(SCROLLBAR_GAP_ABOVE_SAVE_PX, window.innerHeight - top + SCROLLBAR_GAP_ABOVE_SAVE_PX);
}

function computeScrollbarMetrics(params: { element: HTMLElement; railHeight: number }): ScrollbarMetrics {
    const { element, railHeight } = params;
    const maxScrollTop = element.scrollHeight - element.clientHeight;

    if (maxScrollTop <= 0 || railHeight <= 0) {
        return { thumbHeight: 0, thumbTop: 0, show: false };
    }

    const thumbHeight = Math.max(
        MIN_THUMB_HEIGHT_PX,
        Math.round((element.clientHeight / element.scrollHeight) * railHeight)
    );
    const maxThumbTop = Math.max(0, railHeight - thumbHeight);
    const thumbTop = maxThumbTop > 0 ? (element.scrollTop / maxScrollTop) * maxThumbTop : 0;

    return {
        thumbHeight,
        thumbTop,
        show: true
    };
}

export function VolTabPaneScroll({ children }: { children: ReactNode }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [metrics, setMetrics] = useState<ScrollbarMetrics>({
        thumbHeight: 0,
        thumbTop: 0,
        show: false
    });
    const [railBox, setRailBox] = useState<RailBox>({ top: 0, height: 0 });

    const updateScrollbar = useCallback(() => {
        const element = scrollRef.current;
        if (!element) {
            return;
        }

        const { top, height } = element.getBoundingClientRect();
        const bottomReserve = getScrollbarBottomReservePx();
        const railHeight = Math.max(0, Math.round(height - bottomReserve));

        setRailBox({ top, height: railHeight });
        setMetrics(computeScrollbarMetrics({ element, railHeight }));
    }, []);

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) {
            return;
        }

        updateScrollbar();

        element.addEventListener('scroll', updateScrollbar, { passive: true });
        window.addEventListener('resize', updateScrollbar);
        window.addEventListener('scroll', updateScrollbar, true);

        const resizeObserver = new ResizeObserver(updateScrollbar);
        resizeObserver.observe(element);

        const intersectionObserver = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    updateScrollbar();
                }
            },
            { threshold: 0 }
        );
        intersectionObserver.observe(element);

        const layoutContent = element.closest('.ant-layout-content');
        if (layoutContent) {
            resizeObserver.observe(layoutContent);
        }

        const saveButton = document.querySelector('.floatingSaveButton');
        if (saveButton) {
            resizeObserver.observe(saveButton);
        }

        return () => {
            element.removeEventListener('scroll', updateScrollbar);
            window.removeEventListener('resize', updateScrollbar);
            window.removeEventListener('scroll', updateScrollbar, true);
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
        };
    }, [updateScrollbar]);

    return (
        <div className={`${styles.wrap} vol-tab-pane-scroll-wrap`}>
            <div ref={scrollRef} className={`${styles.scroll} vol-tab-pane-scroll`}>
                {children}
            </div>
            {metrics.show ? (
                <div
                    className={styles.rail}
                    aria-hidden
                    style={{
                        top: railBox.top,
                        height: railBox.height
                    }}
                >
                    <div
                        className={styles.thumb}
                        style={{
                            height: metrics.thumbHeight,
                            transform: `translateY(${metrics.thumbTop}px)`
                        }}
                    />
                </div>
            ) : null}
        </div>
    );
}
