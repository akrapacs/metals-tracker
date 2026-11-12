import React from 'react';
import { Box, useToken } from '@chakra-ui/react';
import { useTrendColors } from '../hooks/useTrendColors';

interface SparklineProps {
  values: number[];
  width?: number | string;
  height?: number;
}

export const Sparkline = (props: SparklineProps) => {
  const {
    values,
    width = 120,
    height = 32,
  } = props;

  const { up, down } = useTrendColors();
  const [upColor, downColor] = useToken('colors', [up, down]);

  const points = React.useMemo(() => {
    if (values.length < 2) {
      return null;
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    return values.map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 95 - ((value - min) / span) * 90;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
  }, [values]);

  if (!points) {
    return <Box width={typeof width === 'number' ? `${width}px` : width} height={`${height}px`} />;
  }

  const stroke = values[values.length - 1] >= values[0] ? upColor : downColor;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="img"
      aria-label="Price trend"
      style={{ display: 'block' }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};
