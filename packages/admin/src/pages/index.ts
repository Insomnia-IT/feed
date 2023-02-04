import { checkAuthentication } from '@pankod/refine-nextjs-router';
import type { GetServerSideProps } from 'next';
export { NextRouteComponent as default } from '@pankod/refine-nextjs-router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import { authProvider } from '~/authProvider';

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { isAuthenticated, ...props } = await checkAuthentication(authProvider, context);

    if (!isAuthenticated) {
        return props;
    }

    return {
        props: {}
    };
};

/*
export const getStaticProps = async ({ locale }): Promise<any> => ({
    props: {
        ...(await serverSideTranslations(locale, ['common']))
    }
});
*/
