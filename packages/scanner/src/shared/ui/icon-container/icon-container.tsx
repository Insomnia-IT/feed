import cn from 'classnames';

import css from './icon-container.module.css';

export const IconContainer = (props) => {
    const { className, ...restProps } = props;

    return <div className={cn(css.container, {}, [className])} {...restProps}></div>;
};
