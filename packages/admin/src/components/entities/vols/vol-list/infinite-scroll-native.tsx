import { useEffect, useRef } from 'react';

const DEFAULT_LOADING_TEXT = 'Загрузка...';
const DEFAULT_ERROR_TEXT = 'Ошибка загрузки.';
const DEFAULT_EMPTY_TEXT = 'Больше ничего нет';
const DEFAULT_RETRY_TEXT = 'Повторить';

export const InfiniteScrollNative = ({
    hasMore,
    loading,
    error,
    onLoadMore,
    onRetry,
    loadingText = DEFAULT_LOADING_TEXT,
    errorText = DEFAULT_ERROR_TEXT,
    emptyText = DEFAULT_EMPTY_TEXT,
    retryText = DEFAULT_RETRY_TEXT
}: {
    hasMore: boolean;
    loading: boolean;
    error: boolean;
    onLoadMore: () => void;
    onRetry: () => void;
    loadingText?: string;
    errorText?: string;
    emptyText?: string;
    retryText?: string;
}) => {
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!hasMore || loading) return;
        const target = sentinelRef.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) onLoadMore();
            },
            { rootMargin: '120px' }
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [hasMore, loading, onLoadMore]);

    if (error) {
        return (
            <div style={{ textAlign: 'center' }}>
                {errorText} <button onClick={onRetry}>{retryText}</button>
            </div>
        );
    }

    if (!hasMore) {
        return <div style={{ textAlign: 'center', padding: 16 }}>{emptyText}</div>;
    }

    return (
        <div style={{ textAlign: 'center', padding: 16 }}>
            {loading ? loadingText : null}
            <div ref={sentinelRef} />
        </div>
    );
};
