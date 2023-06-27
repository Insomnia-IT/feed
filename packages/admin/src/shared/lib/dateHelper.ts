import 'dayjs/locale/ru';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { default as dayjsExtended } from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import duration from 'dayjs/plugin/duration';
import isoWeek from 'dayjs/plugin/isoWeek';
import relativeTime from 'dayjs/plugin/relativeTime';
import toObject from 'dayjs/plugin/toObject';
import utc from 'dayjs/plugin/utc';
import weekday from 'dayjs/plugin/weekday';

dayjsExtended.locale('ru');
dayjsExtended.extend(relativeTime);
dayjsExtended.extend(customParseFormat);
dayjsExtended.extend(dayOfYear);
dayjsExtended.extend(isoWeek);
dayjsExtended.extend(weekday);
dayjsExtended.extend(duration);
dayjsExtended.extend(toObject);
dayjsExtended.extend(utc);

const formDateFormat = 'DD-MM-YYYY';

export { dayjsExtended, formDateFormat };
