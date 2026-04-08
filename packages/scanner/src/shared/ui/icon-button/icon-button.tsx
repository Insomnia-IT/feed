import type { ComponentProps } from 'react';
import cn from 'classnames';

import styles from './icon-button.module.css';

interface IconButtonProps extends ComponentProps<'button'> {
    classIcon?: string;
}

export const IconButton = (props: IconButtonProps) => {
    const { children, className = '', ...otherProps } = props;

    return (
        <button className={cn(styles.iconButton, {}, [className])} {...otherProps}>
            {children}
        </button>
    );
};
