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
    whiteEditor?: boolean;
}

export const TextEditor: FC<IProps> = memo(
    ({ value = '', onChange, theme = 'snow', readOnly = false, whiteEditor = false }) => {
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
                <ReactQuill
                    key={editorId}
                    theme={theme}
                    value={value}
                    onChange={handleChange}
                    style={whiteEditor ? { backgroundColor: '#FFF' } : undefined}
                    readOnly={readOnly}
                />
            </Suspense>
        );
    }
);
