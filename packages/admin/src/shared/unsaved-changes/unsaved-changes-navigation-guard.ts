type NavigationAction = () => void;

let guardNavigation: (action: NavigationAction) => void = (action) => action();

export const setUnsavedChangesNavigationGuard = (guard: (action: NavigationAction) => void) => {
    guardNavigation = guard;
};

export const runWithUnsavedChangesGuard = (action: NavigationAction) => {
    guardNavigation(action);
};
