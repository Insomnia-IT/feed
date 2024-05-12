import { ScreenHeader } from '~/components/screen-header';
import { ScreenWrapper } from '~/shared/ui/screen-wrapper/screen-wrapper';
import { AppViews, useView } from '~/model/view-provider';

import { Stats } from '../../components/stats';

export const StatsScreen = () => {
    const { setCurrentView } = useView();
    return (
        <ScreenWrapper>
            <ScreenHeader
                title='Статистика'
                onClickBack={() => {
                    setCurrentView(AppViews.HISTORY);
                }}
            />
            <Stats />
        </ScreenWrapper>
    );
};
