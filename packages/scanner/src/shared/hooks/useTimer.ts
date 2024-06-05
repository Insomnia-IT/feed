import { useEffect, useState } from 'react';

const SECOND = 1000;
const MINUTE = SECOND * 60;

function formatTimerNumber(number: number) {
    return number.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
    });
}

function getTimespan(deadline) {
    return +new Date(deadline) - Date.now() > 0 ? +new Date(deadline) - Date.now() : 0;
}

export function useTimer(deadline: number, interval = SECOND) {
    const [timespan, setTimespan] = useState(() => getTimespan(deadline));

    useEffect(() => {
        const intervalId = setInterval(() => {
            setTimespan(getTimespan(deadline));
        }, interval);

        return () => {
            clearInterval(intervalId);
        };
    }, [interval, deadline]);

    useEffect(() => {
        setTimespan(getTimespan(deadline));
    }, [deadline]);

    return {
        minutes: formatTimerNumber(Math.floor((timespan / MINUTE) % 60)),
        seconds: formatTimerNumber(Math.floor((timespan / SECOND) % 60))
    };
}
