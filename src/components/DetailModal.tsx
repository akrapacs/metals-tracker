import React from 'react';
import { MetalStats, PricePoint } from '../types/metal';
import { formatCurrency, formatDateKey, formatPercent } from '@/util/text';
import { ChangeText } from './ChangeText';
import { Sparkline } from './Sparkline';
import { RangeBar } from './RangeBar';
import {
  Box,
  Text,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';

interface DetailModalProps {
  metal: MetalStats,
  windowLabel: string,
  stripeColor: string,
  isOpen: boolean,
  onClose: () => void,
}

const Field = (props: { label: string, backgroundColor?: string, children: React.ReactNode }) => {
  const {
    label,
    backgroundColor,
    children,
  } = props;

  return (
    <Flex
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      padding={2}
      backgroundColor={backgroundColor}
    >
      <Text fontWeight="bold">
        {label}
      </Text>
      <Box textAlign="right">
        {children}
      </Box>
    </Flex>
  );
};

const PointText = (props: { point: PricePoint | null }) => {
  const { point } = props;
  if (!point) {
    return <Text>-</Text>;
  }
  return (
    <Text>
      {formatCurrency(point.price)}
      <Text as="span" fontSize="xs" opacity={0.7} ml={2}>{formatDateKey(point.date)}</Text>
    </Text>
  );
};

export const DetailModal = (props: DetailModalProps) => {
  const {
    isOpen,
    onClose,
    metal,
    windowLabel,
    stripeColor,
  } = props;

  const fields: [string, React.ReactNode][] = [
    ['1D', <ChangeText key="1d" value={metal.change1d} showArrow />],
    ['7D', <ChangeText key="7d" value={metal.change7d} showArrow />],
    ['30D', <ChangeText key="30d" value={metal.change30d} showArrow />],
    [`${windowLabel} Low`, <PointText key="low" point={metal.low} />],
    [`${windowLabel} High`, <PointText key="high" point={metal.high} />],
    ['From High', <Text key="fromHigh">{metal.fromHigh !== null ? formatPercent(metal.fromHigh) : '-'}</Text>],
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent mx={3}>
        <ModalCloseButton />
        <ModalBody pb={4}>
          <Text
            fontSize="1.2em"
            fontWeight="bold"
            textAlign="center"
            mt={2}
          >
            {metal.name} ({metal.symbol})
          </Text>
          <Text
            fontSize="2xl"
            textAlign="center"
          >
            {metal.price !== null ? formatCurrency(metal.price) : '-'}
            <Text as="span" fontSize="sm" opacity={0.7} ml={1}>/{metal.unit}</Text>
          </Text>

          <Box my={3}>
            <Sparkline values={metal.series} width="100%" height={80} />
          </Box>

          <Flex justifyContent="center" mb={3}>
            <RangeBar position={metal.rangePosition} width="60%" />
          </Flex>

          <Flex flexDirection="column">
            {
              fields.map(([label, value], index) => {
                return (
                  <Field
                    key={label}
                    label={label}
                    backgroundColor={index % 2 !== 0 ? stripeColor : undefined}
                  >
                    {value}
                  </Field>
                );
              })
            }
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
