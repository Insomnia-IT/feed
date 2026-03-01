import cn from 'classnames';
import type { ComponentProps } from 'react';

import css from './icon-container.module.css';

export const IconContainer = (props: ComponentProps<'div'>) => {
    const { className = '', ...restProps } = props;

    return <div className={cn(css.container, {}, [className])} {...restProps}></div>;
};
