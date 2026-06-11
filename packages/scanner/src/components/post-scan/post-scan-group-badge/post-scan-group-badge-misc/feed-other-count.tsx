import { Text } from 'shared/ui/typography';
import { Input } from 'shared/ui/input';

import css from './feed-other-count.module.css';

const normalizeInputValue = ({ value }: { value?: string }): { nextValue: string; nextCount: number } => {
    if (typeof value === 'undefined') {
        return {
            nextValue: '0',
            nextCount: 0
        };
    }

    const digitsOnlyValue = value.replace(/\D/g, '');

    if (digitsOnlyValue === '') {
        return {
            nextValue: '0',
            nextCount: 0
        };
    }

    const normalizedNumber = Number(digitsOnlyValue);

    return {
        nextValue: String(normalizedNumber),
        nextCount: normalizedNumber
    };
};

export const FeedOtherCount = ({
    nonVegansCount,
    setNonVegansCount,
    setVegansCount,
    vegansCount
}: {
    vegansCount: number;
    setVegansCount: (value: number) => void;
    nonVegansCount: number;
    setNonVegansCount: (value: number) => void;
}) => {
    return (
        <div style={{ width: '100%' }}>
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
                        type="text"
                        inputMode="numeric"
                        value={String(vegansCount)}
                        onChange={(event) => {
                            const { nextCount, nextValue } = normalizeInputValue({
                                value: event.currentTarget.value
                            });

                            if (event.currentTarget.value !== nextValue) {
                                event.currentTarget.value = nextValue;
                            }
                            setVegansCount(nextCount);
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
                        type="text"
                        inputMode="numeric"
                        value={String(nonVegansCount)}
                        onChange={(event) => {
                            const { nextCount, nextValue } = normalizeInputValue({
                                value: event.currentTarget.value
                            });

                            if (event.currentTarget.value !== nextValue) {
                                event.currentTarget.value = nextValue;
                            }
                            setNonVegansCount(nextCount);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
