'use client';

import React, { Suspense } from 'react';

interface ServerComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wrapper component for server components in Storybook.
 * This helps handle async components and provides a loading state.
 */
export function ServerComponentWrapper({ 
  children, 
  fallback = <div>Loading...</div> 
}: ServerComponentWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

/**
 * Mock async component wrapper for stories that need to simulate server components
 */
export function mockAsyncComponent<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  asyncData?: () => Promise<any>
) {
  return function MockedComponent(props: T) {
    const [data, setData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(!!asyncData);

    React.useEffect(() => {
      if (asyncData) {
        asyncData().then((result) => {
          setData(result);
          setLoading(false);
        });
      }
    }, []);

    if (loading) {
      return <div>Loading...</div>;
    }

    return <Component {...props} {...data} />;
  };
}