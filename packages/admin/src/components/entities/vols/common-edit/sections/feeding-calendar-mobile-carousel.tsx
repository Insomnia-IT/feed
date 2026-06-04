import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { Dayjs } from 'dayjs';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import styles from './feeding-calendar.module.css';

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
        const slide = viewport?.querySelector<HTMLElement>(`[data-month-index="${index}"]`);
        slide?.scrollIntoView({ inline: 'center', block: 'nearest', behavior });
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

        const handleScroll = () => {
            const slides = [...viewport.querySelectorAll<HTMLElement>('[data-month-index]')];
            if (slides.length === 0) {
                return;
            }

            const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
            let closestIndex = 0;
            let closestDistance = Number.POSITIVE_INFINITY;

            slides.forEach((slide) => {
                const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
                const distance = Math.abs(slideCenter - viewportCenter);
                const index = Number(slide.dataset.monthIndex);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            });

            setActiveIndex(closestIndex);
        };

        viewport.addEventListener('scroll', handleScroll, { passive: true });
        return () => viewport.removeEventListener('scroll', handleScroll);
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
