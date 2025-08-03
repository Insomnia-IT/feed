import React from 'react';

import { ChevronLeft } from 'shared/ui/icons/chevron-left';
import { Title } from 'shared/ui/typography';

import css from './screen-header.module.css';

interface ScreenHeaderProps {
    title: string;
    onClickBack: () => void;
    hintText?: string;
    children?: React.ReactNode;
}
export function ScreenHeader({ children, onClickBack, title }: ScreenHeaderProps): JSX.Element {
    const handleClickBack = () => {
        onClickBack();
    };

    return (
        <header className={css.header}>
            <div className={css.leftBlock}>
                <button className={css.button} onClick={handleClickBack}>
                    <ChevronLeft />
                </button>
                <Title className={css.title}>{title}</Title>
            </div>
            <div>{children}</div>
        </header>
    );
}
