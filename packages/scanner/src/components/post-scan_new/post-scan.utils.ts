import { MealTime, Transaction, Volunteer, FeedType, FeedWithBalance } from '~/db';
import { isVolExpired } from '~/components/misc/misc';
import { getMealTimeText } from '~/lib/utils';

export const validateVol = (
    vol: Volunteer,
    volTransactions: Transaction[],
    kitchenId: string,
    mealTime: MealTime
): { msg: Array<string>; isRed: boolean } => {
    const msg: Array<string> = [];
    let isRed = false;

    if (vol.feed_type !== FeedType.Child && vol.kitchen.toString() !== kitchenId) {
        msg.push(`Кормится на кухне №${vol.kitchen}`);
    }
    if (!vol.is_active) {
        msg.push('Бейдж не активирован в штабе');
    }
    if (vol.is_blocked) {
        isRed = true;
        msg.push('Волонтер заблокирован');
    }
    if (isVolExpired(vol)) {
        msg.push('Даты активности не совпадают');
    }
    if (!FeedWithBalance.has(vol.feed_type)) {
        isRed = true;
        msg.push('НЕТ ПИТАНИЯ, СХОДИ В ИЦ');
    }
    if (volTransactions.some((t) => t.mealTime === mealTime)) {
        msg.push(`Волонтер уже получил ${getMealTimeText(mealTime)}`);
        if (vol.feed_type === FeedType.FT2) {
            isRed = true;
        } else {
            const hasDebt = Object.values(
                volTransactions.reduce(
                    (acc, { mealTime }) => ({
                        ...acc,
                        [mealTime]: (acc[mealTime] || 0) + 1
                    }),
                    {} as { [mealTime: string]: number }
                )
            ).some((count) => count > 1);

            if (hasDebt) {
                msg.push('Волонтер уже питался сегодня в долг');
                isRed = true;
            }
        }
    }

    return { msg, isRed };
};