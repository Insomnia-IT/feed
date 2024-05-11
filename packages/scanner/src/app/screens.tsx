import { PinScreen } from '~/screens/pin-screen/pin-screen';
import { MealTimeSelect } from '~/components/meal-time-select';
import { MainScreen } from '~/screens/main-screen';
import { HistoryScreen } from '~/screens/history-screen/history-screen';
import { StatsScreen } from '~/screens/stats-screen/stats-screen';
import { useApp } from '~/model/app-provider';
import { AppViews, useView } from '~/model/view-provider';

export const Screens = () => {
    const { auth, mealTime } = useApp();
    const { currentView } = useView();
    return (
        <div>
            {!auth && <PinScreen />}
            {auth && !mealTime && <MealTimeSelect />}
            {auth && mealTime && (
                <>
                    {currentView === AppViews.MAIN && <MainScreen />}
                    {currentView === AppViews.HISTORY && <HistoryScreen />}
                    {currentView === AppViews.STATS && <StatsScreen />}
                </>
            )}
            {/*{(isDev || debugModeLS === '1') && <MockTrans />}*/}
        </div>
    );
};
