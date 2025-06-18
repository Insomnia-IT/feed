import { FC, Suspense, memo, lazy, useCallback, useId } from 'react';

const ReactQuill = lazy(async () => {
    const [{ default: Quill }] = await Promise.all([import('react-quill'), import('react-quill/dist/quill.snow.css')]);
    return { default: Quill };
});

interface IProps {
    value?: string;
    onChange?(value: string): void;
    theme?: 'snow' | 'bubble';
    readOnly?: boolean;
}

export const TextEditor: FC<IProps> = memo(({ value = '', onChange, theme = 'snow', readOnly = false }) => {
    const editorId = useId();

    const handleChange = useCallback((newValue: string) => onChange?.(newValue), [onChange]);

    return (
        <Suspense
            fallback={
                <div style={{ padding: 8 }} role="status" aria-busy="true">
                    Загрузка редактора…
                </div>
            }
        >
            <ReactQuill key={editorId} theme={theme} value={value} onChange={handleChange} readOnly={readOnly} />
        </Suspense>
    );
});
