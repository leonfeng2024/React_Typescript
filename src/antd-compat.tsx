import React from 'react';
import { App as AntdApp, ConfigProvider } from 'antd';

// 用于解决antd v5与React 19的兼容性问题
// 参考 https://u.ant.design/v5-for-19

export const AntdCompatProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <ConfigProvider
      theme={{
        // 添加必要的主题配置
        token: {
          colorPrimary: '#1890ff',
        },
        components: {
          // 组件级别配置
        }
      }}
    >
      <AntdApp>
        {children}
      </AntdApp>
    </ConfigProvider>
  );
};

export default AntdCompatProvider; 