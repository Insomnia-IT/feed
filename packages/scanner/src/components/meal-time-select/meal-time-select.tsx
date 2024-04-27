import React, { useContext } from 'react';

import { MealTime } from '~/db';
import { Button } from '~/shared/ui/button/button';
import { useApp } from '~/model/app-provider';

import logo from './logo.png';
import css from './meal-time-select.module.css';

export const MealTimeSelect = () => {
    const { setMealTime } = useApp();
    return (
        <div className={css.mealTimeSelectBlock}>
            <img src={logo} width={101} height={101} />
            <h1 className={css.title}>Чем кормим?</h1>
            <div className={css.buttonsContainer}>
                <Button className={css.button} onClick={() => setMealTime(MealTime.breakfast)}>
                    Завтрак
                </Button>
                <Button className={css.button} onClick={() => setMealTime(MealTime.lunch)}>
                    Обед
                </Button>
                <Button className={css.button} onClick={() => setMealTime(MealTime.dinner)}>
                    Ужин
                </Button>
                <Button className={css.button} onClick={() => setMealTime(MealTime.night)}>
                    Дожор
                </Button>
            </div>
        </div>
    );
};
