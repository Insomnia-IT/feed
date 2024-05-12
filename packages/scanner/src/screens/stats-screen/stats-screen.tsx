import React from 'react';

import { ScreenHeader } from '~/components/screen-header';
import { ScreenWrapper } from '~/shared/ui/screen-wrapper/screen-wrapper';
import { AppViews, useView } from '~/model/view-provider';
import Hint from '~/shared/ui/hint/hint';
import { Text } from '~/shared/ui/typography';

import { Stats } from '../../components/stats';

import css from './stats-screen.module.css';

export const StatsScreen = () => {
    const { setCurrentView } = useView();

    return (
        <ScreenWrapper>
            <ScreenHeader
                title='Статистика'
                onClickBack={() => {
                    setCurrentView(AppViews.HISTORY);
                }}
            >
                <Hint styleBox={css.hintBox}>
                    <Text color='white'>
                        <b>Факт</b> - сколько порций выдано на Полевой Кухне{' '}
                    </Text>
                    <br />
                    <Text color='white'>
                        <b>На поле</b> - сколько волонтеров кушающих на Полевой Кухне активированы в системе{' '}
                    </Text>
                    <br />
                    <Text color='white'>
                        <b>Прогноз</b> - автоматическое предположение сколько порций стоит приготовить (основан на
                        прошедших данных). Прогноз всегда меньше чем “на поле”{' '}
                    </Text>
                </Hint>
            </ScreenHeader>
            <Stats />
        </ScreenWrapper>
    );
};
