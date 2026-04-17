import { useMemo } from 'react';

interface RichTextPreviewProps {
    html?: string | null;
    className?: string;
}

const stripHtml = (html?: string | null): string => {
    if (!html) {
        return '';
    }

    if (typeof window === 'undefined') {
        return html
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
};

export const RichTextPreview = ({ html, className }: RichTextPreviewProps) => {
    const text = useMemo(() => stripHtml(html), [html]);

    return <div className={className}>{text}</div>;
};
