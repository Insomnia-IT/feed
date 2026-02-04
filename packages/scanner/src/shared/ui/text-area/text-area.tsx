import { type ComponentProps, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import cn from 'classnames';

import css from './text-area.module.css';

interface TextAreaProps extends ComponentProps<'textarea'> {
    classContainer?: string;
    isError?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(props, ref) {
    const { classContainer = '', className = '', isError, onChange, value, ...restProps } = props;

    const [isFocus, setIsFocus] = useState(false);

    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

    useImperativeHandle(ref, () => textAreaRef.current!, []);

    useEffect(() => {
        const textArea = textAreaRef.current;

        const handleInput = (e: any) => {
            e.currentTarget.style.height = '0';
            const scrollHeight = e.currentTarget.scrollHeight;

            e.currentTarget.style.height = scrollHeight < 76 ? scrollHeight + 'px' : 76 + 'px';
        };
        const handleFocus = () => {
            setIsFocus(true);
        };
        const handleBlur = () => {
            setIsFocus(false);
        };

        if (textArea) {
            textArea.addEventListener('input', handleInput);
            textArea.addEventListener('focus', handleFocus);
            textArea.addEventListener('blur', handleBlur);
        }

        return () => {
            if (textArea) {
                textArea.removeEventListener('input', handleInput);
                textArea.removeEventListener('focus', handleFocus);
                textArea.removeEventListener('blur', handleBlur);
            }
        };
    }, [textAreaRef]);

    return (
        <div
            className={cn(
                css.container,
                {
                    [css.focus]: isFocus,
                    [css.error]: isError
                },
                [classContainer]
            )}
        >
            <textarea
                ref={textAreaRef}
                className={cn(css.textarea, {}, [className])}
                value={value}
                onChange={onChange}
                {...restProps}
            />
        </div>
    );
});
