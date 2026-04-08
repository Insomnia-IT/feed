import { useCallback, useRef, useState, type ReactNode, type PointerEvent, type MouseEvent } from 'react';

import styles from '../list.module.css';

const SWIPE_ACTION_WIDTH = 88;
const DIRECTION_LOCK_THRESHOLD = 6;

export type SwipeActionItem = {
    key: string;
    text: ReactNode;
    color: string;
    onClick: () => void;
};

export const SwipeActionRow = ({
    rightActions,
    children
}: {
    rightActions: SwipeActionItem[];
    children: ReactNode;
}) => {
    const maxOffset = rightActions.length * SWIPE_ACTION_WIDTH;
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startXRef = useRef(0);
    const startYRef = useRef(0);
    const startOffsetRef = useRef(0);
    const directionRef = useRef<'none' | 'horizontal' | 'vertical'>('none');
    const hasMovedRef = useRef(false);

    const clampOffset = useCallback((value: number) => Math.max(0, Math.min(maxOffset, value)), [maxOffset]);
    const clampedOffset = clampOffset(offset);

    const handlePointerDown = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (maxOffset === 0 || event.button !== 0) return;
            startXRef.current = event.clientX;
            startYRef.current = event.clientY;
            startOffsetRef.current = clampedOffset;
            directionRef.current = 'none';
            hasMovedRef.current = false;
            setIsDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
        },
        [clampedOffset, maxOffset]
    );

    const handlePointerMove = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!isDragging) return;
            const deltaX = startXRef.current - event.clientX;
            const deltaY = startYRef.current - event.clientY;
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            if (
                directionRef.current === 'none' &&
                (absX > DIRECTION_LOCK_THRESHOLD || absY > DIRECTION_LOCK_THRESHOLD)
            ) {
                directionRef.current = absX >= absY ? 'horizontal' : 'vertical';
            }

            if (directionRef.current === 'vertical') {
                setIsDragging(false);
                event.currentTarget.releasePointerCapture(event.pointerId);
                return;
            }

            if (directionRef.current === 'horizontal') {
                if (absX > 4) hasMovedRef.current = true;
                setOffset(clampOffset(startOffsetRef.current + deltaX));
            }
        },
        [clampOffset, isDragging]
    );

    const handlePointerUp = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!isDragging) return;
            event.currentTarget.releasePointerCapture(event.pointerId);
            setIsDragging(false);
            if (maxOffset === 0 || directionRef.current !== 'horizontal') {
                setOffset(0);
                return;
            }
            setOffset((current) => (current > maxOffset / 2 ? maxOffset : 0));
        },
        [isDragging, maxOffset]
    );

    const handleContentClickCapture = useCallback(
        (event: MouseEvent<HTMLDivElement>) => {
            if (hasMovedRef.current) {
                hasMovedRef.current = false;
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            if (clampedOffset > 0) {
                setOffset(0);
                event.preventDefault();
                event.stopPropagation();
            }
        },
        [clampedOffset]
    );

    if (rightActions.length === 0) return <>{children}</>;

    return (
        <div
            className={styles.swipeContainer}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            <div className={styles.swipeActions} style={{ width: maxOffset }}>
                {rightActions.map((action) => (
                    <button
                        key={action.key}
                        className={styles.swipeAction}
                        style={{ backgroundColor: action.color, width: SWIPE_ACTION_WIDTH }}
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setOffset(0);
                            action.onClick();
                        }}
                        type="button"
                    >
                        {action.text}
                    </button>
                ))}
            </div>
            <div
                className={styles.swipeContent}
                style={{
                    transform: `translateX(-${clampedOffset}px)`,
                    transition: isDragging ? 'none' : 'transform 120ms ease'
                }}
                onClickCapture={handleContentClickCapture}
            >
                {children}
            </div>
        </div>
    );
};
