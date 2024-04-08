import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { abi, address } from '@vderunov/whitelist-contract/deployments/11155420/Whitelist';
import { Contract, ethers } from 'ethers';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { SynthetixProvider, useSynthetix } from './useSynthetix';
import { restoreToken } from './utils';

import './main.css';

const queryClient = new QueryClient();

function WalletWatcher({ children }) {
  const [, updateSynthetix] = useSynthetix();

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    async function onAccountsChanged(accounts) {
      const provider = window.ethereum ? new ethers.BrowserProvider(window.ethereum) : undefined;
      const signer = provider ? await provider.getSigner() : undefined;
      const walletAddress = accounts[0] ? accounts[0].toLowerCase() : undefined;
      const token = restoreToken({ walletAddress });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const contract = new Contract(address, abi, signer);

      updateSynthetix({
        walletAddress,
        token,
        provider,
        signer,
        chainId,
        contract,
      });
    }

    const handleChainChanged = (chainId) => updateSynthetix({ chainId });

    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [updateSynthetix]);

  return children;
}

async function run() {
  let provider;
  let signer;
  let walletAddress;
  let contract;

  try {
    if (window.localStorage.getItem('connected') === 'true') {
      provider = window.ethereum ? new ethers.BrowserProvider(window.ethereum) : undefined;
      const accounts = provider ? await provider.listAccounts() : [];
      walletAddress = accounts[0] ? accounts[0].address.toLowerCase() : undefined;
      signer = provider && walletAddress ? await provider.getSigner() : undefined;
      contract = new Contract(address, abi, signer);
    }
  } catch (err) {
    console.error('Failed to set connection:', err);
  }

  const connect = async () => {
    try {
      const provider = window.ethereum ? new ethers.BrowserProvider(window.ethereum) : undefined;
      const signer = provider ? await provider.getSigner() : undefined;
      const walletAddress = signer.address.toLowerCase();
      const token = restoreToken({ walletAddress });
      const chainId = await window.ethereum?.request({ method: 'eth_chainId' });
      const contract = new Contract(address, abi, signer);
      window.localStorage.setItem('connected', 'true');
      return { provider, signer, walletAddress, token, chainId, contract };
    } catch {
      return {};
    }
  };

  const logout = () => {
    window.localStorage.clear();
    window.location.reload();
  };

  const chainId = await window.ethereum?.request({
    method: 'eth_chainId',
  });

  const root = ReactDOM.createRoot(document.querySelector('#app'));
  root.render(
    <React.StrictMode>
      <SynthetixProvider
        {...{
          walletAddress,
          connect,
          logout,
          provider,
          signer,
          token: restoreToken({ walletAddress }),
          chainId,
          contract,
        }}
      >
        <WalletWatcher>
          <QueryClientProvider client={queryClient}>
            <App />
            {process.env.NODE_ENV === 'test' ? null : <ReactQueryDevtools client={queryClient} />}
          </QueryClientProvider>
        </WalletWatcher>
      </SynthetixProvider>
    </React.StrictMode>
  );
}

run();

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => {
    // do nothing
  });
}
