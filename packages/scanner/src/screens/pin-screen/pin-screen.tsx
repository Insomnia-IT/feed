import React, { useCallback, useContext, useState } from 'react';

import { PinInput } from '~/shared/ui/pin-input/pin-input';
import { Button } from '~/shared/ui/button/button';
import { useCheckAuth } from '~/request';
import { API_DOMAIN } from '~/config';
import { AppContext } from '~/app-context';

import css from './pin-screen.module.css';

export const PinScreen = (): React.ReactElement => {
    const { setAuth, setKitchenId } = useContext(AppContext);

    const [pin, setPin] = useState('');
    const storedPin = localStorage.getItem('pin');

    const handleChangeInput = useCallback((value) => {
        setPin(value);
    }, []);

    const checkAuth = useCheckAuth(API_DOMAIN, setAuth);

    const tryAuth = useCallback(() => {
        console.log('auth');
        const enteredPin = pin || '';
        console.log('enteredPin', enteredPin);
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
    }, [checkAuth, pin]);

    return (
        <div className={css.pinScreen}>
            <div className={css.container}>
                <div className={css.header}>
                    <h1 className={css.title}>Пин-код от кухни</h1>
                    <p className={css.desc}>Совершенно секретный код можно узнать у Бюро</p>
                </div>
                <PinInput onChange={handleChangeInput} />
                <Button className={css.button} variant={'main'} onClick={() => tryAuth()}>
                    Войти
                </Button>
            </div>
        </div>
    );
};
