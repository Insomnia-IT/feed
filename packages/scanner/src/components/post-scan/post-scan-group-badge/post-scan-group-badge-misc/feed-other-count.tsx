import { Text } from '~/shared/ui/typography';
import { Input } from '~/shared/ui/input';

export const FeedOtherCount: React.FC<{
    maxCount: number;
    vegansCount: number;
    setVegansCount: (value: number) => void;
    nonVegansCount: number;
    setNonVegansCount: (value: number) => void;
}> = ({ maxCount, nonVegansCount, setNonVegansCount, setVegansCount, vegansCount }) => {
    const fixNumber = (value?: string): number => {
        if (typeof value === 'undefined') {
            return 0;
        }

        return Number(value?.replaceAll(/\D/g, ''));
    };

    return (
        <div style={{ width: '100%' }}>
            <div style={{ paddingBottom: '20px' }}>
                <b>Максимум {maxCount} суммарно</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
                <div>
                    <Text>Веганы 🥦</Text>
                    <Input
                        value={vegansCount}
                        onChange={(event) => {
                            const maxVeganCount = maxCount - nonVegansCount;
                            const value = fixNumber(event?.currentTarget?.value);
                            const isMaxCountReached = value >= maxVeganCount;

                            setVegansCount(isMaxCountReached ? maxVeganCount : value);
                        }}
                    />
                </div>
                <div>
                    <Text>Мясоеды 🥩</Text>

                    <Input
                        value={nonVegansCount}
                        onChange={(event) => {
                            const maxNonVeganCount = maxCount - vegansCount;
                            const value = fixNumber(event?.currentTarget?.value);
                            const isMaxCountReached = value >= maxNonVeganCount;

                            setNonVegansCount(isMaxCountReached ? maxNonVeganCount : value);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
