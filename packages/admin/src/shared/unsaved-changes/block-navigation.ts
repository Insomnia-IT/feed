import type { Navigator as RouterNavigator } from 'react-router';

export type PendingNavigation =
    | { type: 'push'; args: Parameters<RouterNavigator['push']> }
    | { type: 'go'; args: Parameters<RouterNavigator['go']> };

export const installNavigationBlocker = (params: {
    navigator: RouterNavigator;
    onBlock: (navigation: PendingNavigation) => void;
}): (() => void) => {
    const { navigator, onBlock } = params;
    const originalPush = navigator.push.bind(navigator);
    const originalGo = navigator.go.bind(navigator);

    navigator.push = (...args: Parameters<RouterNavigator['push']>) => {
        onBlock({ type: 'push', args });
    };

    navigator.go = (...args: Parameters<RouterNavigator['go']>) => {
        onBlock({ type: 'go', args });
    };

    return () => {
        navigator.push = originalPush;
        navigator.go = originalGo;
    };
};
