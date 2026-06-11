import axios from 'axios';
import { useCallback, useState } from 'react';

import { PinInput } from 'shared/ui/pin-input/pin-input';
import { Button } from 'shared/ui/button/button';
import { API_DOMAIN } from 'config';
import { useCheckAuth } from 'request';
import { useApp } from 'model/app-provider';
import { ScreenWrapper } from 'shared/ui/screen-wrapper';

import css from './pin-screen.module.css';

export const PinScreen = () => {
    const [error, setError] = useState<null | string>(null);

    const { doSync, pin, setAuth, setKitchenId, setPin } = useApp();

    const storedPin = localStorage.getItem('pin');

    const handleChangeInput = useCallback(
        (value: string) => {
            setPin(value);
        },
        [setPin]
    );

    const checkAuth = useCheckAuth(API_DOMAIN, setAuth);

    const tryAuth = useCallback(() => {
        setError(null);
        const enteredPin = pin || '';
        checkAuth(enteredPin)
            .then((user) => {
                const kitchenId = Number(user.data.id);
                localStorage.setItem('pin', enteredPin);
                localStorage.setItem('kitchenId', String(kitchenId));
                setAuth(true);
                setPin(enteredPin);
                setKitchenId(kitchenId);
                return kitchenId;
            })
            .then((kitchenId) => {
                return doSync({ kitchenId });
            })
            .catch((e: unknown) => {
                if ((!axios.isAxiosError(e) || !e.response) && enteredPin && enteredPin === storedPin) {
                    setAuth(true);
                } else {
                    setAuth(false);
                    setError('Пин-код неверный, попробуйте еще раз');
                }
            });
    }, [pin, checkAuth, setAuth, setPin, setKitchenId, storedPin, doSync]);

    return (
        <ScreenWrapper className={css.screenWrapper}>
            <div className={css.container}>
                <div className={css.header}>
                    <h1 className={css.title}>Пин-код от кухни</h1>
                    <p className={css.desc}>Совершенно секретный код можно узнать у Бюро</p>
                </div>
                <PinInput onChange={handleChangeInput} error={error} />
                <Button className={css.button} variant={'main'} onClick={() => tryAuth()}>
                    Войти
                </Button>
            </div>
        </ScreenWrapper>
    );
};
