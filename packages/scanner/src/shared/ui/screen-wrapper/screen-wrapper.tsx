import type { ReactNode } from 'react';
import cn from 'classnames';

import css from './screen-wrapper.module.css';

interface IScreenWrapper {
    children: ReactNode;
    className?: string;
}

export const ScreenWrapper = ({ children, className = '' }: IScreenWrapper) => {
    return <div className={cn(css.screen, { [className]: !!className })}>{children}</div>;
};
