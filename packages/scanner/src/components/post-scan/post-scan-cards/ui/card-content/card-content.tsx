import React from 'react';
import cn from 'classnames';

import css from './card-content.module.css';

export const CardContent = ({ children, className = '' }: React.HTMLAttributes<HTMLDivElement>) => {
    return <div className={cn(css.content, { [className]: !!className })}>{children}</div>;
};
