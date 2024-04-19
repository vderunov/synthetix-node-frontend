import React, { useEffect, useState } from 'react';
import { useSynthetix } from './useSynthetix';

const NetworkMismatchBanner = () => {
  const [synthetix] = useSynthetix();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(`0x${Number(11155420).toString(16)}` !== synthetix.chainId);
  }, [synthetix.chainId]);

  const handleSwitchChain = async () => {
    await window.ethereum?.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${Number(11155420).toString(16)}` }],
    });
  };

  if (!show) {
    return null;
  }

  return (
    <section className="hero is-warning">
      <div className="hero-body">
        <p className="title">Network mismatch detected.</p>
        <p className="subtitle">Please switch to OP Sepolia.</p>
        <button type="button" className="button is-light" onClick={handleSwitchChain}>
          Change chain to OP Sepolia
        </button>
      </div>
    </section>
  );
};

export default NetworkMismatchBanner;
