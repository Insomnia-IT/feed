import { useEffect } from 'react';

import { useUnsavedChangesSaveContext } from './unsaved-changes-save-context';

export const useRegisterUnsavedChangesSave = (saveHandler: () => void) => {
    const { registerSaveHandler } = useUnsavedChangesSaveContext();

    useEffect(() => registerSaveHandler(saveHandler), [registerSaveHandler, saveHandler]);
};
