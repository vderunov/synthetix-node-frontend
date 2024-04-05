import React, { useEffect, useState } from 'react';
import { useSynthetix } from './useSynthetix';

const Banner = () => {
  const [synthetix] = useSynthetix();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setShowBanner(`0x${Number(11155420).toString(16)}` !== synthetix.chainId);
  }, [synthetix.chainId]);

  if (!showBanner) {
    return null;
  }

  return (
    <div className="banner">
      <p>Network mismatch detected. Please switch to OP Sepolia.</p>
    </div>
  );
};

export default Banner;
