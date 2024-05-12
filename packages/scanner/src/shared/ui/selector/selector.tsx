import React, { useEffect, useState } from 'react';
import cn from 'classnames';

import css from './selector.module.css';

interface SelectorProps extends React.ComponentProps<'div'> {
    selectorList: Array<{ id: string; title: string; subTitle: string }>;
    onChangeSelected: (value: string) => void;
    value: string;
}

export const Selector = ({ className = '', onChangeSelected, selectorList, value, ...restProps }: SelectorProps) => {
    const [selectedItem, setSelectedItem] = useState<string>(value || selectorList[0].id);

    useEffect(() => {
        setSelectedItem(value);
    }, [value]);
    const handleClickItem = (itemId) => {
        setSelectedItem(itemId);
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
