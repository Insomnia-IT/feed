import React, { forwardRef } from 'react';
import cn from 'classnames';

import css from './input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    focus?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref): React.ReactElement {
    const { className, error = false, focus = false, ...restProps } = props;
    return (
        <>
            <input
                {...restProps}
                className={cn(css.input, { [css.error]: error, [css.focus]: focus }, [className])}
                ref={ref}
            >
                {props.children}
            </input>
        </>
    );
});
