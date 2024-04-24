import './wdyr';

import type { FC, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import type { FallbackProps } from 'react-error-boundary';
import { ErrorBoundary } from 'react-error-boundary';
import SwipeableViews from 'react-swipeable-views';

import '~/shared/lib/date';

import type { AppColor, IAppContext } from '~/app-context';
import { AppContext, Colors } from '~/app-context';
import { API_DOMAIN } from '~/config';
import css from '~/app.module.css';
import { HistoryScreen } from '~/screens/history-screen';
import { MainScreen } from '~/screens/main';
import { StatsScreen } from '~/screens/stats-screen';
import { useCheckAuth } from '~/request';
import { MockTrans } from '~/components/mock-trans/mock-trans';
import type { MealTime } from '~/db';
import { MealTimeSelect } from '~/components/meal-time-select';
import { Input } from '~/shared/ui/input/input';
import { PinInput } from '~/shared/ui/pin-input/pin-input';
import { Button } from '~/shared/ui/button/button';
import { PinScreen } from '~/screens/pin-screen/pin-screen';
import Modal from '~/shared/ui/modal/modal';

import type { IViewContext } from './view-context';
import { ViewContext } from './view-context';
import { clearCache } from './shared/lib/utils';

// eslint-disable-next-line import/no-unresolved
import ver from '!!raw-loader!pwa-ver.txt';

console.log(`local app ver: ${ver}`);

const isDev = process.env.NODE_ENV !== 'production';

const ErrorFallback: FC<FallbackProps> = ({ error, resetErrorBoundary }) => (
    <div role='alert'>
        <p>я сломался</p>
        <pre>{error.message}</pre>
        <button onClick={resetErrorBoundary}>ПЕРЕЗАГРУЗИТЬ</button>
    </div>
);

const storedPin = localStorage.getItem('pin');
const storedKitchenId = Number(localStorage.getItem('kitchenId'));
const lastSyncStartLS = localStorage.getItem('lastSyncStart');
const debugModeLS = localStorage.getItem('debug');
// TODO: Remove after test
const deoptimizedSyncLS = localStorage.getItem('katya_testiruet');

const App: FC = () => {
    const [appColor, setAppColor] = useState<AppColor | null>(null);
    const [appError, setAppError] = useState<string | null>(null);
    const [mealTime, setMealTime] = useState<MealTime | null>(null);
    const [pin, setPin] = useState<string | null>(storedPin);
    const [auth, setAuth] = useState<boolean>(false);
    const pinInputRef = useRef<HTMLInputElement | null>(null);
    const checkAuth = useCheckAuth(API_DOMAIN, setAuth);
    const appStyle = useMemo(() => ({ backgroundColor: Colors[appColor as AppColor] }), [appColor]);
    const [lastSyncStart, setLastSyncStart] = useState<number | null>(lastSyncStartLS ? +lastSyncStartLS : null);
    const [volCount, setVolCount] = useState<number>(0);
    const [currentView, setCurrentView] = useState<number>(0);
    const [kitchenId, setKitchenId] = useState<number>(storedKitchenId);

    const tryAuth = useCallback(() => {
        const enteredPin = pinInputRef.current?.value || '';
        checkAuth(enteredPin)
            .then((user) => {
                localStorage.setItem('pin', enteredPin);
                localStorage.setItem('kitchenId', user.data.id);
                setAuth(true);
                setPin(enteredPin);
                setKitchenId(+user.data.id);
            })
            .catch((e) => {
                if (!e.response && enteredPin && enteredPin === storedPin) {
                    setAuth(true);
                } else {
                    setAuth(false);
                    alert('Неверный пин!');
                }
            });
    }, [checkAuth]);

    const contextValue: IAppContext = useMemo(
        () => ({
            pin,
            setPin,
            setAuth,
            appError,
            setColor: setAppColor,
            lastSyncStart,
            volCount,
            resetColor: () => setAppColor(null),
            setError: setAppError,
            setLastSyncStart: (ts) => {
                localStorage.setItem('lastSyncStart', String(ts));
                setLastSyncStart(ts);
            },
            setVolCount,
            mealTime,
            setMealTime,
            kitchenId,
            setKitchenId,
            isDev,
            debugMode: debugModeLS,
            deoptimizedSync: deoptimizedSyncLS
        }),
        [pin, appError, lastSyncStart, volCount, mealTime, kitchenId]
    );

    const viewContextValue: IViewContext = useMemo(
        () => ({
            currentView: currentView,
            setCurrentView: setCurrentView
        }),
        [currentView]
    );

    useEffect(() => {
        const checkVer = (): void => {
            console.log('online, check ver..');
            const hash = new Date().toISOString();
            void axios.get(`public/pwa-ver.txt?h=${hash}`).then(({ data }: any): void => {
                console.log(`remote app ver: ${data}`);
                if (data !== ver) {
                    console.log('new version, reloading...');
                    alert('Доступно обновление, приложение перезагрузится');
                    clearCache();
                }
            });
        };

        if (navigator.onLine) {
            checkVer();
        }

        window.addEventListener('online', checkVer);

        return () => {
            window.removeEventListener('online', checkVer);
        };
    }, []);

    return (
        // @ts-ignore
        <ErrorBoundary fallback={ErrorFallback as ReactElement}>
            <AppContext.Provider value={contextValue}>
                <div className={css.app} style={appStyle}>
                    {!auth && (
                        <PinScreen />
                        // <div className={css.auth}>
                        //     {/*<input placeholder='PIN' ref={pinInputRef} type='number' />*/}
                        //     <Button variant={'main'} onClick={tryAuth}>
                        //         ВОЙТИ
                        //     </Button>
                        // </div>
                    )}
                    {auth && !mealTime && <MealTimeSelect />}
                    {auth && mealTime && (
                        <ViewContext.Provider value={viewContextValue}>
                            <SwipeableViews
                                enableMouseEvents
                                index={currentView}
                                onChangeIndex={(index) => setCurrentView(index)}
                            >
                                <MainScreen />
                                <HistoryScreen />
                                <StatsScreen />
                            </SwipeableViews>
                        </ViewContext.Provider>
                    )}
                    {(isDev || debugModeLS === '1') && <MockTrans />}
                </div>
            </AppContext.Provider>
        </ErrorBoundary>
    );
};

// eslint-disable-next-line import/no-default-export
export default App;
