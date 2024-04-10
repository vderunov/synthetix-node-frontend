import React, { useEffect, useState } from 'react';
import { useSynthetix } from './useSynthetix';

const NetworkMismatchSnackbar = () => {
  const [synthetix] = useSynthetix();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(`0x${Number(11155420).toString(16)}` !== synthetix.chainId);
  }, [synthetix.chainId]);

  return (
    <div className={show ? 'snackbar active' : 'snackbar'}>
      <i>warning</i>
      <span>Network mismatch detected. Please switch to OP Sepolia.</span>
    </div>
  );
};

export default NetworkMismatchSnackbar;
