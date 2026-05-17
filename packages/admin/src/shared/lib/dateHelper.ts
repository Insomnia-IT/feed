import 'dayjs/locale/ru';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import duration from 'dayjs/plugin/duration';
import isoWeek from 'dayjs/plugin/isoWeek';
import localeData from 'dayjs/plugin/localeData';
import relativeTime from 'dayjs/plugin/relativeTime';
import toObject from 'dayjs/plugin/toObject';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import weekday from 'dayjs/plugin/weekday';

dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);
dayjs.extend(dayOfYear);
dayjs.extend(isoWeek);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(duration);
dayjs.extend(toObject);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ru');

const formDateFormat = 'DD.MM.YYYY';
const appTimeZone = 'Europe/Moscow';

const formatInAppTimeZone = (value: string | number | Date | dayjs.Dayjs, format: string): string =>
    dayjs(value).tz(appTimeZone).format(format);

export { appTimeZone, dayjs as dayjsExtended, formDateFormat, formatInAppTimeZone };
