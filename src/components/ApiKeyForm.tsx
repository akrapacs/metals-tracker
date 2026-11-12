import React from 'react';
import { Button, Flex, Input, Text } from '@chakra-ui/react';

interface ApiKeyFormProps {
  apiKey: string;
  hasBuiltInKey: boolean;
  onSave: (apiKey: string) => void;
}

export const ApiKeyForm = (props: ApiKeyFormProps) => {
  const {
    apiKey,
    hasBuiltInKey,
    onSave,
  } = props;

  const [value, setValue] = React.useState<string>(apiKey);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(value.trim());
      }}
    >
      <Flex flexDirection="row" alignItems="center">
        <Input
          type="password"
          size="sm"
          placeholder={hasBuiltInKey ? 'Using built-in key' : 'metals.dev API key'}
          value={value}
          autoComplete="off"
          onChange={(event) => {
            setValue(event.target.value);
          }}
        />
        <Button type="submit" size="sm" ml={2}>
          Save
        </Button>
      </Flex>
      <Text fontSize="xs" mt={2} opacity={0.7}>
        Stored only in this browser&apos;s local storage. Get a key at metals.dev.
      </Text>
    </form>
  );
};
