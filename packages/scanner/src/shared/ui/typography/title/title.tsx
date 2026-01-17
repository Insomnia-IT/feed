import cn from 'classnames';
import React from 'react';

import type { TextColor } from 'shared/ui/typography/lib';

import css from './title.module.css';

interface TitleProps extends React.ComponentProps<'h1'> {
    color?: TextColor;
}

export const Title = (props: TitleProps): React.ReactElement => {
    const { children, className = '', color = 'black', ...restProps } = props;
    return (
        <h1 className={cn(css.heading, { [css[color]]: !!color }, [className])} {...restProps}>
            {children}
        </h1>
    );
};
