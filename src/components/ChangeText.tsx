import React from 'react';
import { Flex, Text, TextProps } from '@chakra-ui/react';
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { useTrendColors } from '../hooks/useTrendColors';
import { formatSignedPercent } from '@/util/text';

interface ChangeTextProps extends TextProps {
  value: number | null;
  showArrow?: boolean;
}

export const ChangeText = (props: ChangeTextProps) => {
  const {
    value,
    showArrow = false,
    ...textProps
  } = props;

  const { up, down } = useTrendColors();

  if (value === null) {
    return <Text {...textProps}>-</Text>;
  }

  const color = value > 0 ? up : value < 0 ? down : undefined;

  return (
    <Flex
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      color={color}
    >
      { showArrow && value > 0 && <TriangleUpIcon w={3} h={3} mr={1} /> }
      { showArrow && value < 0 && <TriangleDownIcon w={3} h={3} mr={1} /> }
      <Text {...textProps}>{formatSignedPercent(value)}</Text>
    </Flex>
  );
};
