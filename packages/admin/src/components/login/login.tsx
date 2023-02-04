import { Button, Card, Checkbox, Col, Form, Input, Layout, Row, Typography } from 'antd';
import { useLogin, useTranslate } from '@pankod/refine-core';
import React from 'react';

import { Rules } from '../form/rules';

import { containerStyles, imageContainer, layoutStyles, titleStyles } from './styles';
import logo from './logo.png';

const { Title } = Typography;
export interface ILoginForm {
    username: string;
    password: string;
    remember: boolean;
}

const rowStyle = {
    height: '100vh'
};

export const LoginPage: FC = () => {
    const [form] = Form.useForm<ILoginForm>();
    const translate = useTranslate();

    const { isLoading, mutate: login } = useLogin<ILoginForm>();

    const CardTitle = (
        <Title level={3} style={titleStyles}>
            {/*{translate("pages.login.title", "Sign in your account")}*/}
            КУХНЯ
        </Title>
    );

    return (
        <Layout style={layoutStyles}>
            <Row justify='center' align='middle' style={rowStyle}>
                <Col xs={22}>
                    <div style={containerStyles}>
                        <div style={imageContainer}>
                            {/* @ts-ignore */}
                            <img src={logo.src} alt='feed' />
                        </div>
                        <Card title={CardTitle} headStyle={{ borderBottom: 0 }}>
                            <Form<ILoginForm>
                                layout='vertical'
                                form={form}
                                onFinish={(values) => {
                                    login(values);
                                }}
                                requiredMark={false}
                                initialValues={{
                                    remember: false
                                }}
                            >
                                <Form.Item
                                    name='username'
                                    label={translate('pages.login.username', 'Username')}
                                    rules={Rules.required}
                                >
                                    <Input size='large' placeholder={translate('pages.login.username', 'Username')} />
                                </Form.Item>
                                <Form.Item
                                    name='password'
                                    label={translate('pages.login.password', 'Password')}
                                    rules={Rules.required}
                                    style={{ marginBottom: '12px' }}
                                >
                                    <Input type='password' placeholder='●●●●●●●●' size='large' />
                                </Form.Item>
                                <div style={{ marginBottom: '12px' }}>
                                    <Form.Item name='remember' valuePropName='checked' noStyle>
                                        <Checkbox
                                            style={{
                                                fontSize: '12px'
                                            }}
                                        >
                                            {translate('pages.login.remember', 'Remember me')}
                                        </Checkbox>
                                    </Form.Item>
                                </div>
                                <Button type='primary' size='large' htmlType='submit' loading={isLoading} block>
                                    {translate('pages.login.signin', 'Sign in')}
                                </Button>
                            </Form>
                        </Card>
                    </div>
                </Col>
            </Row>
        </Layout>
    );
};
