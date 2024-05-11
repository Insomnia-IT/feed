import React from 'react';

import { ChevronLeft } from '~/shared/ui/icons/chevron-left';
import { Title } from '~/shared/ui/typography';

import css from './screen-header.module.css';

interface ScreenHeaderProps {
    title: string;
    onClickBack: () => void;
}
export function ScreenHeader({ onClickBack, title }: ScreenHeaderProps): JSX.Element {
    const handleClickBack = () => {
        onClickBack();
    };
    return (
        <header className={css.header}>
            <button className={css.button} onClick={handleClickBack}>
                <ChevronLeft />
            </button>
            <Title className={css.title}>{title}</Title>
        </header>
    );
}
