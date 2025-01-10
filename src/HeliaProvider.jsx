import { car } from '@helia/car';
import { unixfs } from '@helia/unixfs';
import { createHelia } from 'helia';
import { createContext, useCallback, useEffect, useState } from 'react';

export const HeliaContext = createContext({
  helia: null,
  heliaCar: null,
  fs: null,
  error: false,
  starting: true,
});

export const HeliaProvider = ({ children }) => {
  const [helia, setHelia] = useState(null);
  const [heliaCar, setHeliaCar] = useState(null);
  const [fs, setFs] = useState(null);
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState(null);

  const startHelia = useCallback(async () => {
    if (helia) {
      console.info('helia already started');
    } else if (window.helia) {
      console.info('found a windowed instance of helia, populating ...');
      setHelia(window.helia);
      setHeliaCar(car(helia));
      setFs(unixfs(helia));
      setStarting(false);
    } else {
      try {
        console.info('Starting Helia');
        const helia = await createHelia();
        setHelia(helia);
        setHeliaCar(car(helia));
        setFs(unixfs(helia));
        setStarting(false);
      } catch (e) {
        console.error(e);
        setError(true);
      }
    }
  }, [helia]);

  useEffect(() => {
    startHelia();
  }, [startHelia]);

  return (
    <HeliaContext.Provider
      value={{
        helia,
        heliaCar,
        fs,
        error,
        starting,
      }}
    >
      {children}
    </HeliaContext.Provider>
  );
};
