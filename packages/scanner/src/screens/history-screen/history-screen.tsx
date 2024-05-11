import React from 'react';

import { History } from '~/components/history';
import { ScreenHeader } from '~/components/screen-header';
import { ScreenWrapper } from '~/shared/ui/screen-wrapper/screen-wrapper';
import { AppViews, useView } from '~/model/view-provider';
export const HistoryScreen: React.FC = () => {
    const { setCurrentView } = useView();
    return (
        <ScreenWrapper>
            <ScreenHeader
                title='История'
                onClickBack={() => {
                    setCurrentView(AppViews.MAIN);
                }}
            />
            <History />
        </ScreenWrapper>
    );
};
