import Head from 'next/head'
import { Inter } from 'next/font/google'
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { MetalTable } from '@/components/MetalTable';
import { ApiKeyForm } from '@/components/ApiKeyForm';
import { useMetals } from '../hooks/useMetals';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DefaultHistoryDays, DefaultUpdateIntervalMinutes, HistoryWindows } from '../const/metals';
import { isMarketOpen } from '../util/dates';
import { SunIcon, MoonIcon, SettingsIcon } from '@chakra-ui/icons'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Link,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  Input,
  useColorMode,
  useDisclosure,
} from '@chakra-ui/react';

const inter = Inter({ subsets: ['latin'] })

const formatter = new Intl.NumberFormat('en-US', { minimumIntegerDigits: 2 });

const BuiltInApiKey = process.env.NEXT_PUBLIC_METALS_API_KEY ?? '';

const formatCountdown = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = formatter.format(totalSeconds % 60);
  if (hours > 0) {
    return `${hours}:${formatter.format(minutes)}:${seconds}`;
  }
  return `${minutes}:${seconds}`;
};

const Tracker = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const settingsDisclosure = useDisclosure();

  const [storedApiKey, setStoredApiKey] = useLocalStorage<string>('apiKey', '');
  const [updateInterval, setUpdateInterval] = useLocalStorage<string>('updateInterval', DefaultUpdateIntervalMinutes);
  const [historyDays, setHistoryDays] = useLocalStorage<number>('historyDays', DefaultHistoryDays);
  const [now, setNow] = useState<number>(() => Date.now());

  const apiKey = storedApiKey || BuiltInApiKey;
  const historyWindow = HistoryWindows.find((window) => window.days === historyDays) ?? HistoryWindows[0];

  const { stats, latest, usage, error, loading, lastAttemptAt, refresh } = useMetals(apiKey, historyWindow.days);

  const intervalMinutes = parseFloat(updateInterval);
  const autoRefresh = intervalMinutes > 0;
  const marketOpen = isMarketOpen(new Date(now));

  const updateDue = React.useMemo(() => {
    if (!apiKey || !autoRefresh) {
      return null;
    }
    const lastUpdate = Math.max(latest ? Date.parse(latest.fetchedAt) : 0, lastAttemptAt ?? 0);
    return lastUpdate + intervalMinutes * 60 * 1000;
  }, [apiKey, autoRefresh, latest, lastAttemptAt, intervalMinutes]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (updateDue === null || now < updateDue) {
      return;
    }
    // Every call counts against the monthly quota, so skip background tabs and closed markets
    if (document.visibilityState !== 'visible' || (latest && !marketOpen)) {
      return;
    }
    refresh();
  }, [now, updateDue, latest, marketOpen, refresh]);

  const refreshStatus = React.useMemo(() => {
    if (!apiKey) {
      return '';
    }
    if (!autoRefresh) {
      return 'Auto-refresh off';
    }
    if (latest && !marketOpen) {
      return 'Market closed, auto-refresh paused';
    }
    if (updateDue !== null && updateDue > now) {
      return `Refreshing in ${formatCountdown(updateDue - now)}`;
    }
    return '';
  }, [apiKey, autoRefresh, latest, marketOpen, updateDue, now]);

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
            >
              <Text
                fontSize="x-small"
                mr={1}
              >
                Update Interval (min):
              </Text>
              <Input
                placeholder=""
                size="xs"
                width="4em"
                value={`${updateInterval}`}
                onChange={(event) => {
                  setUpdateInterval(event.target.value);
                }}
              />
            </Flex>

            <Flex
              flexDirection="row"
              alignItems="center"
              gap={2}
            >
              <Button
                size="sm"
                aria-label="Settings"
                onClick={settingsDisclosure.onOpen}
              >
                <SettingsIcon w={4} h={4} />
              </Button>

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
                isDisabled={!apiKey}
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

        { !apiKey ? (
          <Box
            borderWidth="1px"
            borderRadius="md"
            padding={4}
            maxWidth="32em"
            alignSelf="center"
            width="100%"
            mt={4}
            mb={4}
          >
            <Text fontWeight="bold" mb={2}>
              Enter your metals.dev API key to get started
            </Text>
            <ApiKeyForm
              apiKey=""
              hasBuiltInKey={false}
              onSave={setStoredApiKey}
            />
          </Box>
        ) : (
          <Box mb={3}>
            <MetalTable metals={stats} windowLabel={historyWindow.label} />
          </Box>
        )}

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
            </Text>
          )}
        </Flex>
        <Flex
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
        >
          { refreshStatus !== '' && (
            <Text
              fontSize="xs"
            >
              {refreshStatus}
            </Text>
          )}
        </Flex>
        <Flex
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
        >
          <Text
            fontSize="xs"
            opacity={0.7}
          >
            metals.dev requests this month from this browser: {usage.count}
          </Text>
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

      <Modal isOpen={settingsDisclosure.isOpen} onClose={settingsDisclosure.onClose} isCentered>
        <ModalOverlay />
        <ModalContent mx={3}>
          <ModalHeader fontSize="md">metals.dev API key</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <ApiKeyForm
              apiKey={storedApiKey}
              hasBuiltInKey={BuiltInApiKey !== ''}
              onSave={(value) => {
                setStoredApiKey(value);
                settingsDisclosure.onClose();
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default function Home() {
  // Settings and cached prices live in localStorage, which isn't available in the static export's prerender
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
