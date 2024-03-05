import { useSynthetix } from './useSynthetix';

export function App() {
  const [synthetix] = useSynthetix();

  return (
    <div className="navigation">
      <div className="flexContainer">
        <h2>Synthetix node Frontend</h2>
        <div className="rightNav">
          {synthetix.walletAddress ? (
            <button type="button">Login</button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                try {
                  await window.ethereum.request({ method: 'eth_requestAccounts' });
                } catch {}
              }}
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
