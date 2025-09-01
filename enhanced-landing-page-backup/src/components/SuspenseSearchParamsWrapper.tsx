'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Props {
  onParamsFetch: (params: Record<string, string>) => void;
  children: React.ReactNode;
}

const SuspenseSearchParamsWrapper: React.FC<Props> = ({
  onParamsFetch,
  children,
}) => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    onParamsFetch(params);
  }, [searchParams, onParamsFetch]);

  return <>{children}</>; // Render the children after fetching search params
};

export default SuspenseSearchParamsWrapper;
