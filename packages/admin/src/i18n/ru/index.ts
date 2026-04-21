import common from './common.json';
import pages from './pages.json';
import resources from './resources.json';

import type { TranslationTree } from '../provider';

export const ruMessages: TranslationTree = {
    ...common,
    ...pages,
    ...resources
};
