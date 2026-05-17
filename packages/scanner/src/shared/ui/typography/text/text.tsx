import cn from 'classnames';
import type { ComponentProps } from 'react';
import type { TextColor } from 'shared/ui/typography/lib';

import css from './text.module.css';

const colorClassName: Record<TextColor, string> = {
    black: css.black,
    white: css.white
};

interface TextProps extends ComponentProps<'p'> {
    color?: TextColor;
}

export const Text = (props: TextProps) => {
    const { children, className, color = 'black', ...restProps } = props;
    return (
        <p className={cn(css.text, colorClassName[color], [className])} {...restProps}>
            {children}
        </p>
    );
};
