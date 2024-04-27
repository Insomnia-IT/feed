import React from 'react';
import cn from 'classnames';

import { History } from '~/components/history';
import { ScreenHeader } from '~/components/screen-header';

import css from '../app/app.module.css';

export const HistoryScreen: React.FC = () => {
    return (
        <div className={cn(css.screen, css.history)}>
            <ScreenHeader>История</ScreenHeader>
            <History />
        </div>
    );
};
