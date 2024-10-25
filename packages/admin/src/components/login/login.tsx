import { Button, Card, Checkbox, Col, Form, Input, Layout, Row, Segmented, Space, Typography } from 'antd';
import { useLogin, useTranslate } from '@pankod/refine-core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

import { Rules } from '../form/rules';
import logo from '../../../../scanner/src/assets/images/logo.svg';

import { containerStyles, imageContainer, layoutStyles, titleStyles } from './styles';

const { Title } = Typography;
export interface ILoginForm {
    username: string;
    password: string;
    remember: boolean;
    isQR: boolean;
}

const rowStyle = {
    height: '100vh'
};

type OptionValue = 'qr' | 'login';

export const LoginPage: FC = () => {
    const [form] = Form.useForm<ILoginForm>();
    const translate = useTranslate();
    const [selectedOption, setSelectedOption] = useState<OptionValue>('qr');

    const { isLoading, mutate: login } = useLogin<ILoginForm>();
    const scanner = useRef<QrScanner | null>(null);
    const video = useRef<HTMLVideoElement | null>(null);

    const loadingRef = useRef(false);

    const onScan = useCallback((qr: string) => {
        if (loadingRef.current) {
            return;
        }

        loadingRef.current = true;
        login({
            username: qr,
            password: '',
            isQR: true,
            remember: false
        });

        setTimeout(() => {
            loadingRef.current = false;
        }, 1000);
    }, []);

    useEffect(() => {
        if (selectedOption !== 'qr' || !video.current) return;

        const s = new QrScanner(
            video.current,
            ({ data }) => {
                void onScan(data.replace(/[^A-Za-z0-9]/g, ''));
            },
            {
                onDecodeError: () => {
                    // no handle
                },
                highlightScanRegion: true,
                highlightCodeOutline: true
            }
        );

        scanner.current = s;

        void s.start();

        return () => {
            s.destroy();
        };
    }, [onScan, selectedOption]);

    const onVideoReady = (ref: HTMLVideoElement) => {
        video.current = ref;
    };

    useEffect(() => {
        // @ts-ignore
        function onHardwareScan({ detail: { scanCode } }): void {
            void onScan(scanCode.replace(/[^A-Za-z0-9]/g, ''));
        }

        // @ts-ignore
        document.addEventListener('scan', onHardwareScan);

        return (): void => {
            // @ts-ignore
            document.removeEventListener('scan', onHardwareScan);
        };
    }, [onScan]);

    const loginForm = (
        <div style={{ minHeight: '390px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Card>
                <Form<ILoginForm>
                    layout='vertical'
                    form={form}
                    onFinish={(values) => login(values)}
                    requiredMark={false}
                    initialValues={{ remember: false }}
                >
                    <Form.Item name='username' rules={[{ required: true, message: 'Пожалуйста, введите логин' }]}>
                        <Input size='large' placeholder={translate('pages.login.username', 'Username')} />
                    </Form.Item>
                    <Form.Item name='password' rules={[{ required: true, message: 'Пожалуйста, введите пароль' }]}>
                        <Input
                            type='password'
                            placeholder={translate('pages.login.password', 'Password')}
                            size='large'
                        />
                    </Form.Item>
                    <div style={{ marginBottom: '28px' }}>
                        <Form.Item name='remember' valuePropName='checked' noStyle>
                            <Checkbox style={{ fontSize: '14px' }}>
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
    );

    const qrForm = <video ref={onVideoReady} style={{ width: '100%', borderRadius: '6px', minHeight: '390px' }} />;

    return (
        <Layout style={layoutStyles}>
            <Row justify='center' align='middle' style={rowStyle}>
                <Col xs={22}>
                    <div style={containerStyles}>
                        <div style={imageContainer}>
                            {/* @ts-ignore */}
                            <img src={logo.src} alt='Логотип фестиваля' style={{ height: '44px' }} />
                            <Title level={4} style={titleStyles}>
                                Вход в Кормитель
                            </Title>
                        </div>
                        <Space direction='vertical' size='large' style={{ display: 'flex' }}>
                            {selectedOption === 'qr' ? qrForm : loginForm}
                            <Segmented
                                options={[
                                    {
                                        label: (
                                            <div style={{ padding: 6 }}>
                                                <div>Сканировать QR-код</div>
                                            </div>
                                        ),
                                        value: 'qr'
                                    },
                                    {
                                        label: (
                                            <div style={{ padding: 6 }}>
                                                <div>Логин и пароль</div>
                                            </div>
                                        ),
                                        value: 'login'
                                    }
                                ]}
                                block
                                onChange={(value) => setSelectedOption(value as OptionValue)}
                            />
                        </Space>
                    </div>
                </Col>
            </Row>
        </Layout>
    );
};
