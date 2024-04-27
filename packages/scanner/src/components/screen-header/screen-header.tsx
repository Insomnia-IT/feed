import React, { useContext } from 'react';

import { ReactComponent as Home } from '~/shared/icons/arrow_left.svg';
import { useView } from '~/model/view-provider/view-provider';

import style from './screen-header.module.css';

export function ScreenHeader({ children }): JSX.Element {
    const { setCurrentView } = useView();
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
