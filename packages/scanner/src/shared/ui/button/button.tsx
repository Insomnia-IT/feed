import React from 'react';
import cn from 'classnames';

import styles from './button.module.css';

type ButtonVariant = 'main' | 'secondary' | 'alternative';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
}

export const Button = (props: ButtonProps): React.ReactElement => {
    const { children, className, variant = 'main', ...otherProps } = props;

    const mods = {
        [styles[variant]]: Boolean(variant)
    };

    return (
        <button className={cn(styles.button, mods, [className])} {...otherProps}>
            {children}
        </button>
    );
};
