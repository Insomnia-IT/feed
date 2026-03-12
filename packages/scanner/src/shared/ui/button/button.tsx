import type { ComponentProps } from 'react';
import cn from 'classnames';

import css from './button.module.css';

type ButtonVariant = 'main' | 'secondary' | 'alternative';
interface ButtonProps extends ComponentProps<'button'> {
    variant?: ButtonVariant;
}

export const Button = (props: ButtonProps) => {
    const { children, className = '', variant = 'main', ...restProps } = props;

    const mods = {
        [css[variant]]: Boolean(variant)
    };

    return (
        <button className={cn(css.button, mods, [className])} {...restProps}>
            {children}
        </button>
    );
};
