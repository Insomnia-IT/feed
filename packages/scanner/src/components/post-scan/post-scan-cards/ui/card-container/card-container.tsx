import cn from 'classnames';
import { type HTMLAttributes } from 'react';

import css from './card-container.module.css';

type CardColors = 'red' | 'white' | 'blue';

interface CardContainerProps extends HTMLAttributes<HTMLDivElement> {
    cardColor?: CardColors;
}

export const CardContainer = (props: CardContainerProps) => {
    const { cardColor = 'white', children, className = '' } = props;

    return <div className={cn(css.cardContainer, {}, [css[cardColor], className])}>{children}</div>;
};
