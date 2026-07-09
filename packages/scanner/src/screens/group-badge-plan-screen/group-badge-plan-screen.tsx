import { ScreenHeader } from 'components/screen-header';
import { ScreenWrapper } from 'shared/ui/screen-wrapper';
import { AppViews, useView } from 'model/view-provider';
import { GroupBadgePlan } from 'components/group-badge-plan';

export const GroupBadgePlanScreen = () => {
    const { setCurrentView } = useView();

    return (
        <ScreenWrapper>
            <ScreenHeader
                title="План по групповым бейджам"
                onClickBack={() => {
                    setCurrentView(AppViews.HISTORY);
                }}
            />
            <GroupBadgePlan />
        </ScreenWrapper>
    );
};
