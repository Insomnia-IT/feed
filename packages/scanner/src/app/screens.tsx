import SwipeableViews from 'react-swipeable-views';

import { PinScreen } from '~/screens/pin-screen/pin-screen';
import { MealTimeSelect } from '~/components/meal-time-select';
import { MainScreen } from '~/screens/main-screen/main';
import { HistoryScreen } from '~/screens/history-screen';
import { StatsScreen } from '~/screens/stats-screen';
import { useApp } from '~/model/app-provider';
import { useView } from '~/model/view-provider';

export const Screens = () => {
    const { auth, mealTime } = useApp();
    const { currentView, setCurrentView } = useView();
    return (
        <div>
            {!auth && <PinScreen />}
            {auth && !mealTime && <MealTimeSelect />}
            {auth && mealTime && (
                <SwipeableViews enableMouseEvents index={currentView} onChangeIndex={(index) => setCurrentView(index)}>
                    <MainScreen />
                    <HistoryScreen />
                    <StatsScreen />
                </SwipeableViews>
            )}
            {/*{(isDev || debugModeLS === '1') && <MockTrans />}*/}
        </div>
    );
};
