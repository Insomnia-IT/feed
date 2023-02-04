import { checkAuthentication } from '@pankod/refine-nextjs-router';
import type { GetServerSideProps } from 'next';
export { NextRouteComponent as default } from '@pankod/refine-nextjs-router';

import { authProvider } from '~/authProvider';
import { dataProvider } from '~/dataProvider';

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { isAuthenticated, ...props } = await checkAuthentication(authProvider, context);

    if (!isAuthenticated) {
        return props;
    }

    const { query } = context;

    try {
        const data = await dataProvider.getList({
            resource: query['resource'] as string
        });

        return {
            props: {
                initialData: data
            }
        };
    } catch (error) {
        return { props: {} };
    }
};
