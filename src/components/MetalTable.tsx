import React from 'react';
import { ResponsiveComponent } from './ResponsiveComponents';
import { MetalStats, PricePoint } from '../types/metal';
import { formatCurrency, formatDateKey, formatPercent } from '@/util/text';
import { DetailModal } from './DetailModal';
import { ChangeText } from './ChangeText';
import { Sparkline } from './Sparkline';
import { RangeBar } from './RangeBar';
import {
  Box,
  Center,
  Flex,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  TextProps,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useColorMode,
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons'

interface MetalTableProps {
  metals: MetalStats[],
  windowLabel: string,
}

interface InternalProps extends MetalTableProps {
  stripeColor: string;
}

const TdCopyable = (props: any) => {
  const {
    children,
    textToCopy
  } = props;

  const [hovering, setHovering] = React.useState<boolean>(false);
  const [mouseDown, setMoustDown] = React.useState<boolean>(false);

  return (
    <Td
      onMouseEnter={() => {
        setHovering(true);
      }}
      onMouseLeave={() => {
        setHovering(false);
      }}
      _hover={{
        cursor: 'pointer',
      }}
      onMouseDown={() => {
        setMoustDown(true);
      }}
      onMouseUp={() => {
        setMoustDown(false);
      }}
      onClick={(event: React.MouseEvent) => {
        event.stopPropagation();
        navigator.clipboard.writeText(textToCopy);
      }}
      color={mouseDown ? '#888888' : undefined}
      position="relative"
    >
      <Center>
        { children }
      </Center>

      { hovering && (
        <CopyIcon
          w={3}
          h={3}
          position="absolute"
          right={1}
          top="50%"
          transform="translateY(-50%)"
        />
      )}
    </Td>
  );
};

// Hide secondary columns on mid-size screens so the table doesn't scroll sideways; the row's detail modal shows them all
const WideOnly = { base: 'none', xl: 'table-cell' };
const LargeOnly = { base: 'none', lg: 'table-cell' };

const HeaderCell = (props: { children: React.ReactNode, display?: Record<string, string> }) => {
  return (
    <Th color="white" display={props.display}>
      <Center>
        {props.children}
      </Center>
    </Th>
  );
};

const PriceText = (props: { price: number | null, unit: string } & TextProps) => {
  const { price, unit, ...textProps } = props;
  return (
    <Text whiteSpace="nowrap" {...textProps}>
      {price !== null ? formatCurrency(price) : '-'}
      <Text as="span" fontSize="xs" opacity={0.6} ml={1}>/{unit}</Text>
    </Text>
  );
};

const PointCell = (props: { point: PricePoint | null }) => {
  const { point } = props;
  return (
    <Td>
      <Flex flexDirection="column" alignItems="center">
        <Text>{point ? formatCurrency(point.price) : '-'}</Text>
        { point && (
          <Text fontSize="xs" opacity={0.6}>{formatDateKey(point.date)}</Text>
        )}
      </Flex>
    </Td>
  );
};

const MetalName = (props: { metal: MetalStats }) => {
  const { metal } = props;
  return (
    <Flex flexDirection="column">
      <Text fontWeight="bold">{metal.name}</Text>
      <Text fontSize="xs" opacity={0.6}>{metal.symbol}</Text>
    </Flex>
  );
};

const MobileView = (props: InternalProps) => {
  const {
    metals,
    windowLabel,
    stripeColor,
  } = props;

  const [selectedMetal, setSelectedMetal] = React.useState<MetalStats | null>(null);

  const detailModalDisclosure = useDisclosure();

  const selected = metals.find((metal) => metal.id === selectedMetal?.id) ?? null;

  return (
    <>
      <TableContainer>
        <Table size="sm">
          <Thead>
            <Tr backgroundColor="black">
              <Th color="white" py={3} px={3}>Metal</Th>
              <HeaderCell>Price</HeaderCell>
              <HeaderCell>1D</HeaderCell>
            </Tr>
          </Thead>
          <Tbody>
            {
              metals.map((metal: MetalStats, index: number) => {
                return (
                  <Tr
                    key={metal.id}
                    backgroundColor={index % 2 !== 0 ? stripeColor : undefined}
                    cursor="pointer"
                    onClick={() => {
                      setSelectedMetal(metal);
                      detailModalDisclosure.onOpen();
                    }}
                  >
                    <Td py={3} px={3}>
                      <MetalName metal={metal} />
                    </Td>
                    <Td px={2}>
                      <Center>
                        <PriceText price={metal.price} unit={metal.unit} fontWeight="semibold" />
                      </Center>
                    </Td>
                    <Td px={3}>
                      <Flex flexDirection="column" alignItems="center">
                        <ChangeText value={metal.change1d} showArrow fontWeight="bold" />
                        <Box mt={1}>
                          <Sparkline values={metal.series} width={64} height={18} />
                        </Box>
                      </Flex>
                    </Td>
                  </Tr>
                );
              })
            }
          </Tbody>
        </Table>
      </TableContainer>

      { selected && (
        <DetailModal
          metal={selected}
          windowLabel={windowLabel}
          stripeColor={stripeColor}
          isOpen={detailModalDisclosure.isOpen}
          onClose={detailModalDisclosure.onClose}
        />
      )}
    </>
  )
};

const StandardView = (props: InternalProps) => {
  const {
    metals,
    windowLabel,
    stripeColor,
  } = props;

  const [selectedMetal, setSelectedMetal] = React.useState<MetalStats | null>(null);

  const detailModalDisclosure = useDisclosure();

  const selected = metals.find((metal) => metal.id === selectedMetal?.id) ?? null;

  return (
    <>
      <TableContainer>
        <Table size="sm">
          <Thead>
            <Tr backgroundColor="black">
              <Th color="white" py={3}>Metal</Th>
              <HeaderCell>Price</HeaderCell>
              <HeaderCell>1D</HeaderCell>
              <HeaderCell>7D</HeaderCell>
              <HeaderCell>30D</HeaderCell>
              <HeaderCell>{windowLabel} Low</HeaderCell>
              <HeaderCell display={LargeOnly}>Range</HeaderCell>
              <HeaderCell>{windowLabel} High</HeaderCell>
              <HeaderCell display={WideOnly}>From High</HeaderCell>
              <HeaderCell display={WideOnly}>{windowLabel} Trend</HeaderCell>
            </Tr>
          </Thead>
          <Tbody>
            {
              metals.map((metal: MetalStats, index: number) => {
                return (
                  <Tr
                    key={metal.id}
                    backgroundColor={index % 2 !== 0 ? stripeColor : undefined}
                    cursor="pointer"
                    onClick={() => {
                      setSelectedMetal(metal);
                      detailModalDisclosure.onOpen();
                    }}
                  >
                    <Td py={3}>
                      <MetalName metal={metal} />
                    </Td>
                    <TdCopyable
                      textToCopy={metal.price?.toString() ?? ''}
                    >
                      <PriceText price={metal.price} unit={metal.unit} fontSize="lg" fontWeight="semibold" />
                    </TdCopyable>
                    <Td>
                      <ChangeText value={metal.change1d} showArrow />
                    </Td>
                    <Td>
                      <ChangeText value={metal.change7d} />
                    </Td>
                    <Td>
                      <ChangeText value={metal.change30d} />
                    </Td>
                    <PointCell point={metal.low} />
                    <Td display={LargeOnly}>
                      <Center>
                        <RangeBar position={metal.rangePosition} />
                      </Center>
                    </Td>
                    <PointCell point={metal.high} />
                    <Td display={WideOnly}>
                      <Center>
                        {metal.fromHigh !== null ? formatPercent(metal.fromHigh) : '-'}
                      </Center>
                    </Td>
                    <Td display={WideOnly}>
                      <Center>
                        <Sparkline values={metal.series} width={100} />
                      </Center>
                    </Td>
                  </Tr>
                );
              })
            }
          </Tbody>
        </Table>
      </TableContainer>

      { selected && (
        <DetailModal
          metal={selected}
          windowLabel={windowLabel}
          stripeColor={stripeColor}
          isOpen={detailModalDisclosure.isOpen}
          onClose={detailModalDisclosure.onClose}
        />
      )}
    </>
  );
};

export const MetalTable = (props: MetalTableProps) => {
  const { colorMode } = useColorMode();

  const stripeColor = React.useMemo(() => {
    if (colorMode === 'dark') {
      return '#2c2c2c';
    } else {
      return '#e2e2e2';
    }
  }, [colorMode]);

  return (
    <ResponsiveComponent
      mobileComponent={
        <MobileView
          stripeColor={stripeColor}
          { ...props }
        />
      }
      standardComponent={
        <StandardView
          stripeColor={stripeColor}
          { ...props }
        />
      }
    />
  );
};
