import { useColorModeValue } from '@chakra-ui/react';

export const useTrendColors = () => {
  const up = useColorModeValue('green.600', 'green.300');
  const down = useColorModeValue('red.600', 'red.300');
  return { up, down };
};
