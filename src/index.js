import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ethers } from 'ethers';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { SynthetixProvider, useSynthetix } from './useSynthetix';

const queryClient = new QueryClient();

function WalletWatcher({ children }) {
  const [, updateSynthetix] = useSynthetix();

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    function onAccountsChanged(accounts) {
      updateSynthetix({ walletAddress: accounts[0] ? accounts[0].toLowerCase() : undefined });
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

  try {
    await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
  } catch {}

  const root = ReactDOM.createRoot(document.querySelector('#app'));
  root.render(
    <React.StrictMode>
      <SynthetixProvider {...{ walletAddress }}>
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
