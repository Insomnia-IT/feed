import { PinScreen } from 'screens/pin-screen';
import { MealTimeSelect } from 'components/meal-time-select';
import { MainScreen } from 'screens/main-screen';
import { HistoryScreen } from 'screens/history-screen/history-screen';
import { StatsScreen } from 'screens/stats-screen/stats-screen';
import { useApp } from 'model/app-provider';
import { AppViews, useView } from 'model/view-provider';
import { SettingsScreen } from 'screens/settings-screen/settings-screen';
import { MockTrans } from 'components/mock-trans/mock-trans';
import { AutoSync } from 'components/auto-sync';

export const Screens = () => {
    const { auth, autoSync, debugMode, isDev, mealTime } = useApp();
    const { currentView } = useView();
    return (
        <>
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

            {/* Overlay components */}
            {(isDev || debugMode === '1') && <MockTrans />}
            {autoSync && <AutoSync />}
        </>
    );
};
