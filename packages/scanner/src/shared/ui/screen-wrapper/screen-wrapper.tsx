import React from 'react';
import cn from 'classnames';

import css from './screen-wrapper.module.css';

export const ScreenWrapper = ({ children, className = '' }) => {
    return <div className={cn(css.screen, { [className]: !!className })}>{children}</div>;
};
