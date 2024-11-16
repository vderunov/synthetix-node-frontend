import { useContext } from 'react';
import { HeliaContext } from './HeliaProvider';

export const useHelia = () => {
  const { helia, fs, heliaCar, error, starting } = useContext(HeliaContext);
  return { helia, heliaCar, fs, error, starting };
};
