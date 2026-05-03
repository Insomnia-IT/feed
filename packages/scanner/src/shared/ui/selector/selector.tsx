import { type ComponentProps } from 'react';
import cn from 'classnames';

import css from './selector.module.css';

interface SelectorProps extends ComponentProps<'div'> {
    selectorList: Array<{ id: string; title: string; subTitle: string }>;
    onChangeSelected: (value: string) => void;
    value: string;
}

export const Selector = ({ className = '', onChangeSelected, selectorList, value, ...restProps }: SelectorProps) => {
    const selectedItem = value || selectorList[0].id;

    const handleClickItem = (itemId: string) => {
        onChangeSelected(itemId);
    };
    return (
        <div className={cn(css.selector, { [className]: !!className })} {...restProps}>
            {selectorList.map((item) => (
                <div
                    className={cn(css.selectorItem, { [css.selected]: selectedItem === item.id })}
                    onClick={() => {
                        handleClickItem(item.id);
                    }}
                    key={item.id}
                >
                    <p className={css.title}>{item.title}</p>
                    {item.subTitle && <p className={css.subTitle}>{item.subTitle}</p>}
                </div>
            ))}
        </div>
    );
};
