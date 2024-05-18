import React from 'react';
import cn from 'classnames';

import { CircleCheck } from '~/shared/ui/icons/circle-check';
import { CircleXmark } from '~/shared/ui/icons/circle-xmark';

import css from './alert.module.css';

interface AlertProps extends React.ComponentProps<'div'> {
    type?: 'success' | 'error';
    text?: string;
    withAction?: boolean;
    onClickAction?: () => void;
    textAction?: string;
}

export const Alert = (props: AlertProps): React.ReactElement => {
    const {
        className = '',
        onClickAction,
        text,
        textAction,
        type = 'success',
        withAction = false,
        ...restProps
    } = props;

    const handleClickAction = (_e): void => {
        if (onClickAction) {
            onClickAction();
        }
    };

    return (
        <div className={cn(css.alert, {}, [className])} {...restProps}>
            <div className={css.leftBlock}>
                {type === 'success' && <CircleCheck className={css.icon} color='#1A9A6B' />}
                {type === 'error' && <CircleXmark color='#DD2E4E' />}
                <p className={cn(css.text, {}, [css.withTextWrap])}>
                    <span className={css.span}>{text}</span>
                </p>
                <p className={css.text}>
                    <span className={css.span}>1(с)</span>
                </p>
            </div>
            {withAction && (
                <button className={css.action} onClick={handleClickAction}>
                    {textAction}
                </button>
            )}
        </div>
    );
};
