import { useEffect, useRef, useState } from 'react';

export const useAnchorNavigation = (containerRef: React.RefObject<HTMLElement>) => {
    const [activeAnchor, setActiveAnchor] = useState('section1');
    const isScrolling = useRef(false);
    const activeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const sections = container.querySelectorAll('section[id^="section"]');

        const handleScroll = () => {
            if (isScrolling.current) return;

            if (activeTimeout.current) {
                clearTimeout(activeTimeout.current);
            }

            activeTimeout.current = setTimeout(() => {
                let closestSectionId = '';
                let minDistance = Infinity;

                sections.forEach((section) => {
                    const rect = section.getBoundingClientRect();
                    const distance = Math.abs(rect.top - container.getBoundingClientRect().top);

                    if (distance < minDistance) {
                        minDistance = distance;
                        closestSectionId = section.id;
                    }
                });

                if (closestSectionId) {
                    setActiveAnchor(closestSectionId);
                }
            }, 100);
        };

        const handleAnchorClick = (e: Event) => {
            const target = e.target as HTMLElement;
            const id = target.getAttribute('data-id');
            if (!id) return;

            isScrolling.current = true;
            setActiveAnchor(id);

            const targetSection = document.getElementById(id);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }

            setTimeout(() => {
                isScrolling.current = false;
            }, 500);
        };

        container.addEventListener('scroll', handleScroll);
        const navItems = document.querySelectorAll('[data-id]');
        navItems.forEach((item) => {
            item.addEventListener('click', handleAnchorClick);
        });

        return () => {
            container.removeEventListener('scroll', handleScroll);
            navItems.forEach((item) => {
                item.removeEventListener('click', handleAnchorClick);
            });
            if (activeTimeout.current) {
                clearTimeout(activeTimeout.current);
            }
        };
    }, [containerRef]);

    return { activeAnchor };
};
