import React, { memo } from 'react';
import cn from 'classnames';

import { Text } from '~/shared/ui/typography';

import css from './switcher.module.css';

interface InputProps extends React.ComponentProps<'input'> {
    text?: string;
}
export const Switcher = memo(function Switcher(props: InputProps) {
    const { checked, className = '', disabled, name, onChange, text, value, ...restProps } = props;

    return (
        <label className={cn(css.label, {}, [className])}>
            <input
                disabled={disabled}
                value={value}
                name={name}
                checked={checked}
                onChange={onChange}
                type='checkbox'
                className={`${css.checkbox}`}
                {...restProps}
            />
            <span className={css.customCheckbox}></span>
            {text && <Text>{text}</Text>}
        </label>
    );
});
