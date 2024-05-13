import { PinScreen } from '~/screens/pin-screen/pin-screen';
import { MealTimeSelect } from '~/components/meal-time-select';
import { MainScreen } from '~/screens/main-screen';
import { HistoryScreen } from '~/screens/history-screen/history-screen';
import { StatsScreen } from '~/screens/stats-screen/stats-screen';
import { useApp } from '~/model/app-provider';
import { AppViews, useView } from '~/model/view-provider';
import { SettingsScreen } from '~/screens/settings-screen/settings-screen';
import { MockTrans } from '~/components/mock-trans/mock-trans';

export const Screens = () => {
    const { auth, debugMode, isDev, mealTime } = useApp();
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
                    {currentView === AppViews.SETTINGS && <SettingsScreen />}
                </>
            )}
            {(isDev || debugMode === '1') && <MockTrans />}
        </div>
    );
};
