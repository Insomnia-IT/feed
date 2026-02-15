import { memo, useEffect, useId, useRef } from 'react';

import 'quill/dist/quill.snow.css';
import 'quill/dist/quill.bubble.css';

type QuillInstance = any;

interface IProps {
    value?: string;
    onChange?(value: string): void;
    theme?: 'snow' | 'bubble';
    readOnly?: boolean;
    placeholder?: string;
    className?: string;
}

const TOOLBAR: any = [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean']
];

export const TextEditor = memo(function TextEditor({
    value = '',
    onChange,
    theme = 'snow',
    readOnly = false,
    placeholder,
    className
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
        let disposed = false;

        const mount = async () => {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = '';

            const host = document.createElement('div');
            container.appendChild(host);

            const quillMod: any = await import('quill');
            const QuillCtor = quillMod.default ?? quillMod;

            if (disposed) return;

            const q = new QuillCtor(host, {
                theme,
                readOnly,
                placeholder,
                modules: { toolbar: TOOLBAR }
            });

            quillRef.current = q;

            const applyHtml = (html: string) => {
                const delta = q.clipboard.convert(html);
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
                if (containerRef.current) containerRef.current.innerHTML = '';
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
            const delta = q.clipboard.convert(next);
            q.setContents(delta, 'silent');
            if (sel) q.setSelection(sel);
            lastHtmlRef.current = q.root.innerHTML;
        }
    }, [value]);

    return <div id={editorId} ref={containerRef} className={className ?? 'quill'} />;
});
