import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ethers } from 'ethers';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { SynthetixProvider, useSynthetix } from './useSynthetix';
import { getTokensFromLocalStorage } from './utils';

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
      updateSynthetix({
        walletAddress: accounts[0] ? accounts[0].toLowerCase() : undefined,
        provider,
        signer,
      });
    }

    window.ethereum.on('accountsChanged', onAccountsChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged);
    };
  }, [updateSynthetix]);

  return children;
}

async function run() {
  const provider = window.ethereum ? new ethers.BrowserProvider(window.ethereum) : undefined;
  const accounts = provider ? await provider.listAccounts() : [];
  const walletAddress = accounts[0] ? accounts[0].address.toLowerCase() : undefined;
  const signer = provider ? await provider.getSigner() : undefined;

  const connect = async () => {
    try {
      await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
    } catch {}
  };

  const root = ReactDOM.createRoot(document.querySelector('#app'));
  root.render(
    <React.StrictMode>
      <SynthetixProvider
        {...{ walletAddress, connect, provider, signer, tokens: getTokensFromLocalStorage() }}
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
