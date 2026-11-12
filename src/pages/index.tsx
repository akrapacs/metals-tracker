import Head from 'next/head'
import { Inter } from 'next/font/google'
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { MetalTable } from '@/components/MetalTable';
import { usePrices } from '../hooks/usePrices';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DefaultHistoryDays, HistoryWindows } from '../const/metals';
import { isMarketOpen } from '../util/dates';
import { SunIcon, MoonIcon } from '@chakra-ui/icons'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Link,
  Flex,
  Heading,
  Select,
  Text,
  useColorMode,
} from '@chakra-ui/react';

const inter = Inter({ subsets: ['latin'] })

// Left behind by earlier versions that called metals.dev from the browser, including the API key
const LegacyStorageKeys = ['apiKey', 'latest', 'history', 'observed', 'historyCoverage', 'requestUsage', 'updateInterval'];

const Tracker = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  const [historyDays, setHistoryDays] = useLocalStorage<number>('historyDays', DefaultHistoryDays);

  const historyWindow = HistoryWindows.find((window) => window.days === historyDays) ?? HistoryWindows[0];

  const { stats, latest, error, loading, refresh } = usePrices(historyWindow.days);

  useEffect(() => {
    LegacyStorageKeys.forEach((key) => {
      localStorage.removeItem(`metals-tracker:${key}`);
    });
  }, []);

  return (
    <Box
      className={`${inter.className}`}
      display="flex"
      flexDirection="column"
      padding="2%"
    >
      <Flex
        flexDirection="column"
      >
        <Flex
          flexDirection="row"
          flexWrap="wrap"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
          mb={2}
        >
          <Heading size="md">
            Metals Tracker
          </Heading>

          <Flex
            flexDirection="row"
            flexWrap="wrap"
            alignItems="center"
            gap={3}
          >
            <Flex
              flexDirection="row"
              alignItems="center"
            >
              <Text
                fontSize="x-small"
                mr={1}
              >
                History:
              </Text>
              <Select
                size="xs"
                width="5.5em"
                value={historyWindow.days}
                onChange={(event) => {
                  setHistoryDays(parseInt(event.target.value));
                }}
              >
                { HistoryWindows.map((window) => (
                  <option key={window.days} value={window.days}>{window.label}</option>
                ))}
              </Select>
            </Flex>

            <Flex
              flexDirection="row"
              alignItems="center"
              gap={2}
            >
              <Button
                size="sm"
                aria-label="Toggle color mode"
                onClick={() => {
                  toggleColorMode();
                }}
              >
                { colorMode === 'dark' && (
                  <SunIcon w={4} h={4} color="white" />
                )}
                { colorMode === 'light' && (
                  <MoonIcon w={4} h={4} color="black" />
                )}
              </Button>

              <Button
                size="sm"
                isLoading={loading}
                onClick={() => {
                  refresh();
                }}
              >
                Refresh
              </Button>
            </Flex>
          </Flex>
        </Flex>

        { error && (
          <Alert status="error" mb={3} borderRadius="md">
            <AlertIcon />
            <AlertDescription fontSize="sm">{error}</AlertDescription>
          </Alert>
        )}

        <Box mb={3}>
          <MetalTable metals={stats} windowLabel={historyWindow.label} />
        </Box>

        <Flex
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
        >
          { latest && (
            <Text
              fontSize="xs"
            >
              Prices as of {dayjs(latest.timestamp).format('dddd, MMMM D, YYYY HH:mm')}
              { !isMarketOpen() && ' (market closed)' }
            </Text>
          )}
        </Flex>

        <Flex
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          mt={2}
        >
          <Link
            href="https://metals.dev"
            isExternal
          >
            <Text
              fontSize="xs"
            >
              Powered by Metals.Dev
            </Text>
          </Link>
        </Flex>
      </Flex>
    </Box>
  );
};

export default function Home() {
  // Settings live in localStorage, which isn't available in the static export's prerender
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Head>
        <title>Metals Tracker</title>
        <meta name="description" content="Precious metals price tracker" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/metals-tracker/icon.svg" type="image/svg+xml" />
      </Head>
      { mounted && <Tracker /> }
    </>
  )
}
