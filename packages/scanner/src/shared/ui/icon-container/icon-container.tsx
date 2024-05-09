import cn from 'classnames';
import React from 'react';

import css from './icon-container.module.css';

export const IconContainer = (props: React.ComponentProps<'div'>): React.ReactElement => {
    const { className = '', ...restProps } = props;

    return <div className={cn(css.container, {}, [className])} {...restProps}></div>;
};
