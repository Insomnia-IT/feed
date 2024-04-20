import React from 'react';

import { StatsDateEnum } from '~/components/stats';
import { ReactComponent as Prev } from '~/shared/icons/arrow_left_small.svg';
import { ReactComponent as Next } from '~/shared/icons/arrow_right_small.svg';

import style from './stats-date-picker.module.css';

interface StatsDatePickerProps {
    progress: boolean;
    statsDate: StatsDateEnum;
    formattedDate: string;
    setStatsDate: (StatsDateEnum) => void;
}

export const StatsDatePicker = ({ formattedDate, progress, setStatsDate, statsDate }: StatsDatePickerProps) => {
    const prevClickHandle = () => {
        if (statsDate === StatsDateEnum.today) {
            setStatsDate(StatsDateEnum.yesterday);
        }
        if (statsDate === StatsDateEnum.tomorrow) {
            setStatsDate(StatsDateEnum.today);
        }
    };

    const nextClickHandle = () => {
        if (statsDate === StatsDateEnum.today) {
            setStatsDate(StatsDateEnum.tomorrow);
        }
        if (statsDate === StatsDateEnum.yesterday) {
            setStatsDate(StatsDateEnum.today);
        }
    };

    return (
        <div className={style.datePicker}>
            <button
                className={style.button}
                disabled={statsDate === StatsDateEnum.yesterday || progress}
                onClick={prevClickHandle}
            >
                <Prev className={style.svg} />
            </button>
            <span className={style.date}>{formattedDate}</span>
            <button
                className={style.button}
                disabled={statsDate === StatsDateEnum.tomorrow || progress}
                onClick={nextClickHandle}
            >
                <Next className={style.svg} />
            </button>
        </div>
    );
};
