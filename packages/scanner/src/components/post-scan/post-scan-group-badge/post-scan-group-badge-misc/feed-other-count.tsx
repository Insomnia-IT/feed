import { Text } from 'shared/ui/typography';
import { Input } from 'shared/ui/input';

import css from './feed-other-count.module.css';

const fixNumber = (value?: string): number => {
    if (typeof value === 'undefined') {
        return 0;
    }

    return Number(value?.replaceAll(/\D/g, ''));
};

export const FeedOtherCount: React.FC<{
    maxCount: number;
    vegansCount: number | string;
    setVegansCount: (value: number | string) => void;
    nonVegansCount: number | string;
    setNonVegansCount: (value: number | string) => void;
}> = ({ maxCount, nonVegansCount, setNonVegansCount, setVegansCount, vegansCount }) => {
    const maxVeganCount = maxCount - Number(nonVegansCount);
    const maxNonVeganCount = maxCount - Number(vegansCount);

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
                    <Text>Веганы 🥦</Text>
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
                    <Text>Мясоеды 🥩</Text>

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
