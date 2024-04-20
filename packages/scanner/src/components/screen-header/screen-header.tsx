import React, { useContext } from 'react';

import { ReactComponent as Home } from '~/shared/icons/arrow_left.svg';
import { ViewContext } from '~/view-context';

import style from './screen-header.module.css';

export function ScreenHeader({ children }): JSX.Element {
    const { setCurrentView } = useContext(ViewContext);
    const change = (index: number): void => {
        setCurrentView(index);
    };
    return (
        <header className={style.header}>
            <button className={style.button} onClick={() => change(0)}>
                <Home />
            </button>
            <h1>{children}</h1>
        </header>
    );
}
