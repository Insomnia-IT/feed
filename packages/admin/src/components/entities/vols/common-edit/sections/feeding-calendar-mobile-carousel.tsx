import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { Dayjs } from 'dayjs';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import styles from './feeding-calendar.module.css';

function clampScrollLeft(viewport: HTMLElement, scrollLeft: number): number {
    const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    return Math.min(Math.max(0, scrollLeft), maxScrollLeft);
}

function getCenteredScrollLeft(viewport: HTMLElement, slide: HTMLElement): number {
    const viewportRect = viewport.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    const slideCenter = slideRect.left + slideRect.width / 2;
    const viewportCenter = viewportRect.left + viewportRect.width / 2;
    return viewport.scrollLeft + (slideCenter - viewportCenter);
}

function getClosestSlideIndex(viewport: HTMLElement): number {
    const slides = [...viewport.querySelectorAll<HTMLElement>('[data-month-index]')];
    if (slides.length === 0) {
        return 0;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const viewportCenter = viewportRect.left + viewportRect.width / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide) => {
        const slideRect = slide.getBoundingClientRect();
        const slideCenter = slideRect.left + slideRect.width / 2;
        const distance = Math.abs(slideCenter - viewportCenter);
        const index = Number(slide.dataset.monthIndex);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
        }
    });

    return closestIndex;
}

type FeedingCalendarMobileCarouselProps = {
    monthPanels: Dayjs[];
    initialIndex: number;
    renderMonth: (panelValue: Dayjs) => ReactNode;
};

export function FeedingCalendarMobileCarousel({
    monthPanels,
    initialIndex,
    renderMonth
}: FeedingCalendarMobileCarouselProps) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(initialIndex);

    const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
        const viewport = viewportRef.current;
        if (!viewport) {
            return;
        }

        const slide = viewport.querySelector<HTMLElement>(`[data-month-index="${index}"]`);
        if (!slide) {
            return;
        }

        // Scroll only the carousel viewport horizontally. scrollIntoView also scrolls
        // ancestor containers (e.g. VolTabPaneScroll) and jumps the volunteer card to Питание.
        const scrollLeft = clampScrollLeft(viewport, getCenteredScrollLeft(viewport, slide));
        viewport.scrollTo({ left: scrollLeft, behavior });
    }, []);

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            scrollToIndex(initialIndex, 'auto');
        });
        return () => window.cancelAnimationFrame(frameId);
    }, [initialIndex, scrollToIndex]);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) {
            return undefined;
        }

        let scrollFrameId: number | null = null;

        const handleScroll = () => {
            if (scrollFrameId !== null) {
                return;
            }

            scrollFrameId = window.requestAnimationFrame(() => {
                scrollFrameId = null;
                const closestIndex = getClosestSlideIndex(viewport);
                setActiveIndex((previousIndex) => (previousIndex === closestIndex ? previousIndex : closestIndex));
            });
        };

        viewport.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            viewport.removeEventListener('scroll', handleScroll);
            if (scrollFrameId !== null) {
                window.cancelAnimationFrame(scrollFrameId);
            }
        };
    }, []);

    const canGoPrev = activeIndex > 0;
    const canGoNext = activeIndex < monthPanels.length - 1;

    return (
        <div className={styles.monthsCarousel}>
            <div className={styles.monthsCarouselNav}>
                <Button
                    type="text"
                    size="small"
                    icon={<LeftOutlined />}
                    disabled={!canGoPrev}
                    aria-label="Предыдущий месяц"
                    onClick={() => scrollToIndex(activeIndex - 1)}
                />
                <span className={styles.monthsCarouselNavTitle}>{monthPanels[activeIndex]?.format('MMMM YYYY')}</span>
                <Button
                    type="text"
                    size="small"
                    icon={<RightOutlined />}
                    disabled={!canGoNext}
                    aria-label="Следующий месяц"
                    onClick={() => scrollToIndex(activeIndex + 1)}
                />
            </div>
            <div ref={viewportRef} className={styles.monthsCarouselViewport}>
                <div className={styles.monthsCarouselTrack}>
                    {monthPanels.map((panelValue, index) => (
                        <div
                            key={panelValue.format('YYYY-MM')}
                            className={styles.monthsCarouselSlide}
                            data-month-index={index}
                        >
                            {renderMonth(panelValue)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
