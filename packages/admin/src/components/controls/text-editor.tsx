import { memo, useEffect, useId, useRef } from 'react';

import 'quill/dist/quill.snow.css';
import 'quill/dist/quill.bubble.css';

type QuillSelection = { index: number; length: number };
type QuillDelta = unknown;

interface QuillInstance {
    root: { innerHTML: string };
    clipboard: {
        convert: (content: { html?: string; text?: string }, formats?: Record<string, unknown>) => QuillDelta;
    };
    setContents: (delta: QuillDelta, source?: string) => void;
    on: (eventName: string, handler: () => void) => void;
    off: (eventName: string, handler: () => void) => void;
    getSelection: () => QuillSelection | null;
    setSelection: (range: QuillSelection) => void;
}

interface QuillModule {
    default?: new (host: string | HTMLElement, options?: unknown) => QuillInstance;
}

interface IProps {
    value?: string;
    onChange?(value: string): void;
    theme?: 'snow' | 'bubble';
    readOnly?: boolean;
    placeholder?: string;
    className?: string;
    whiteEditor?: boolean;
}

export const TextEditor = memo(function TextEditor({
    value = '',
    onChange,
    theme = 'snow',
    readOnly = false,
    placeholder,
    className,
    whiteEditor
}: IProps) {
    const editorId = useId();

    const containerRef = useRef<HTMLDivElement | null>(null);
    const quillRef = useRef<QuillInstance | null>(null);

    const onChangeRef = useRef<IProps['onChange']>(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const lastHtmlRef = useRef<string>(value ?? '');

    useEffect(() => {
        const mountContainer = containerRef.current;
        if (!mountContainer) return;

        let disposed = false;

        const mount = async () => {
            mountContainer.innerHTML = '';

            const host = document.createElement('div');
            mountContainer.appendChild(host);

            const quillMod = (await import('quill')) as unknown as QuillModule;
            const QuillCtor = quillMod.default;
            if (!QuillCtor) return;

            if (disposed) return;

            const q = new QuillCtor(host, {
                theme,
                readOnly,
                placeholder
            });

            quillRef.current = q;

            const applyHtml = (html: string) => {
                const delta = q.clipboard.convert({ html });
                q.setContents(delta, 'silent');
            };

            applyHtml(value ?? '');
            lastHtmlRef.current = q.root.innerHTML;

            const onTextChange = () => {
                const html = q.root.innerHTML;
                lastHtmlRef.current = html;
                onChangeRef.current?.(html);
            };

            q.on('text-change', onTextChange);

            return () => {
                q.off('text-change', onTextChange);
            };
        };

        let detach: undefined | (() => void);

        mount().then((fn) => {
            detach = fn;
        });

        return () => {
            disposed = true;
            try {
                detach?.();
            } finally {
                quillRef.current = null;
                mountContainer.innerHTML = '';
            }
        };
    }, [theme, placeholder, readOnly]);

    useEffect(() => {
        const q = quillRef.current;
        if (!q) return;

        const next = value ?? '';
        const current = q.root.innerHTML;

        if (next !== current && next !== lastHtmlRef.current) {
            const sel = q.getSelection();
            const delta = q.clipboard.convert({ html: next });
            q.setContents(delta, 'silent');
            if (sel) q.setSelection(sel);
            lastHtmlRef.current = q.root.innerHTML;
        }
    }, [value]);

    return (
        <div
            id={editorId}
            ref={containerRef}
            className={className ?? 'quill'}
            style={whiteEditor ? { backgroundColor: '#FFF' } : undefined}
        />
    );
});
