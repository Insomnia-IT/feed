import { Text } from 'shared/ui/typography';
import { Input } from 'shared/ui/input';

import css from './feed-other-count.module.css';

const fixNumber = (value?: string): number => {
    if (typeof value === 'undefined') {
        return 0;
    }

    return Number(value?.replaceAll(/\D/g, ''));
};

export const FeedOtherCount = ({
    maxCount,
    nonVegansCount,
    setNonVegansCount,
    setVegansCount,
    vegansCount
}: {
    maxCount: number;
    vegansCount: number;
    setVegansCount: (value: number) => void;
    nonVegansCount: number;
    setNonVegansCount: (value: number) => void;
}) => {
    const maxVeganCount = maxCount - nonVegansCount;
    const maxNonVeganCount = maxCount - vegansCount;

    return (
        <div style={{ width: '100%' }}>
            <div style={{ paddingBottom: '20px' }}>
                <b>Максимум {maxCount} суммарно</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
                <div
                    style={{
                        width: '50%'
                    }}
                >
                    <Text className={css.otherLabel}>Веганы 🥦</Text>
                    <Input
                        className={css.otherInput}
                        style={{
                            maxWidth: '90%'
                        }}
                        type="number"
                        max={maxVeganCount}
                        value={vegansCount}
                        onChange={(event) => {
                            const textValue = event?.currentTarget?.value;

                            if (textValue === '' || textValue === undefined) {
                                setVegansCount(0);

                                return;
                            }

                            const value = fixNumber(textValue);
                            const isMaxCountReached = value >= maxVeganCount;

                            setVegansCount(isMaxCountReached ? maxVeganCount : value);
                        }}
                    />
                </div>
                <div
                    style={{
                        width: '50%'
                    }}
                >
                    <Text className={css.otherLabel}>Мясоеды 🥩</Text>
                    <Input
                        className={css.otherInput}
                        style={{
                            maxWidth: '90%'
                        }}
                        type="number"
                        max={maxNonVeganCount}
                        value={nonVegansCount}
                        onChange={(event) => {
                            const textValue = event?.currentTarget?.value;

                            if (textValue === '' || textValue === undefined) {
                                setNonVegansCount(0);
                                return;
                            }

                            const value = fixNumber(textValue);
                            const isMaxCountReached = value >= maxNonVeganCount;

                            setNonVegansCount(isMaxCountReached ? maxNonVeganCount : value);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
