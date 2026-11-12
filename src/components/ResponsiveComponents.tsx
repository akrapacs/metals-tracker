import React from 'react';
import { useMediaQuery } from '@chakra-ui/react';

export const ResponsiveComponent = (props: any) => {
  const {
    mobileComponent,
    standardComponent,
  } = props;

  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    if (!loaded) {
      setLoaded(true);
    }
  }, [loaded]);
  const [isMobile] = useMediaQuery('(max-width: 800px)');

  if (loaded) {
    return <>{isMobile ? <>{mobileComponent}</> : <>{standardComponent}</>}</>;
  }
  return null;
};