import { AppViews, useView } from 'model/view-provider';
import { ScreenHeader } from 'components/screen-header';
import { ScreenWrapper } from 'shared/ui/screen-wrapper';
import { Settings } from 'components/settings';

export const SettingsScreen = () => {
    const { setCurrentView } = useView();
    return (
        <ScreenWrapper>
            <ScreenHeader
                title="Настройки"
                onClickBack={() => {
                    setCurrentView(AppViews.MAIN);
                }}
            />
            <Settings />
        </ScreenWrapper>
    );
};
