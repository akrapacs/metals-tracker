import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';

interface RangeBarProps {
  position: number | null;
  width?: string;
}

export const RangeBar = (props: RangeBarProps) => {
  const {
    position,
    width = '80px',
  } = props;

  const trackColor = useColorModeValue('gray.300', 'gray.600');
  const markerColor = useColorModeValue('yellow.600', 'yellow.300');

  return (
    <Box
      position="relative"
      width={width}
      height="6px"
      borderRadius="full"
      backgroundColor={trackColor}
      title={position !== null ? `${Math.round(position * 100)}% of range` : undefined}
    >
      { position !== null && (
        <Box
          position="absolute"
          left={`calc(${Math.min(Math.max(position, 0), 1) * 100}% - 5px)`}
          top="-2px"
          width="10px"
          height="10px"
          borderRadius="full"
          backgroundColor={markerColor}
        />
      )}
    </Box>
  );
};
