import crudDataProvider from '@pankod/refine-nestjsx-crud';

import { API_URL } from '~/const';
import { axios } from '~/authProvider';
import { getUserData } from '~/auth';

const token = getUserData({}, false);

if (token) {
    axios.defaults.headers.common = {
        Authorization: `Bearer ${token}`
    };
}

const dataProvider = crudDataProvider(API_URL, axios);

export { dataProvider };
