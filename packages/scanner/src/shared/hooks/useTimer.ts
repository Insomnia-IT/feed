import { useEffect, useState } from 'react';

const SECOND = 1000;
const MINUTE = SECOND * 60;

function formatTimerNumber(number: number) {
    return number.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
    });
}

const getTimespan = (deadline: number | string | Date, now: number) => {
    return Math.max(+new Date(deadline) - now, 0);
};

export function getTimerParts(deadline: number | string | Date, now: number) {
    const timespan = getTimespan(deadline, now);

    return {
        minutes: formatTimerNumber(Math.floor((timespan / MINUTE) % 60)),
        seconds: formatTimerNumber(Math.floor((timespan / SECOND) % 60))
    };
}

export function useTimer(deadline: number, interval = SECOND) {
    const [now, setNow] = useState(Date.now);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setNow(Date.now());
        }, interval);

        return () => {
            clearInterval(intervalId);
        };
    }, [interval]);

    return getTimerParts(deadline, now);
}
