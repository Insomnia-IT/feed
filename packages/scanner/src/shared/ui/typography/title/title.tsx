import cn from 'classnames';
import type { ComponentProps } from 'react';
import type { TextColor } from 'shared/ui/typography/lib';

import css from './title.module.css';

const colorClassName: Record<TextColor, string> = {
    black: css.black,
    white: css.white
};

interface TitleProps extends ComponentProps<'h1'> {
    color?: TextColor;
}

export const Title = (props: TitleProps) => {
    const { children, className = '', color = 'black', ...restProps } = props;
    return (
        <h1 className={cn(css.heading, colorClassName[color], [className])} {...restProps}>
            {children}
        </h1>
    );
};
