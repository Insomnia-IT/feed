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
            .then((user: any) => {
                localStorage.setItem('pin', enteredPin);
                localStorage.setItem('kitchenId', user.data.id);
                setAuth(true);
                setPin(enteredPin);
                setKitchenId(Number(user.data.id));
                return user;
            })
            .then((user: any) => {
                return doSync({ kitchenId: Number(user.data.id) });
            })
            .catch((e: any) => {
                if (!e.response && enteredPin && enteredPin === storedPin) {
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
