import React, { useContext } from 'react';

import { MealTime } from '~/db';
import { AppContext } from '~/app-context';
import { Button } from '~/shared/ui/button/button';

import logo from './logo.png';
import css from './meal-time-select.module.css';

export const MealTimeSelect = () => {
    const { setMealTime } = useContext(AppContext);
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
