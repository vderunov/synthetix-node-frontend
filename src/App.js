import { useMutation } from '@tanstack/react-query';
import { useSynthetix } from './useSynthetix';
import { getApiUrl, saveToken } from './utils';

const makeUnauthenticatedRequest = async (endpoint, data) => {
  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export function App() {
  const [synthetix, updateSynthetix] = useSynthetix();
  const { walletAddress, connect, token, signer } = synthetix;

  const signupMutation = useMutation({
    mutationFn: (data) => makeUnauthenticatedRequest('signup', data),
    onSuccess: ({ nonce }) =>
      signer.signMessage(nonce).then((signedMessage) => {
        verificationMutation.mutate({ nonce, signedMessage });
      }),
  });

  const verificationMutation = useMutation({
    mutationFn: (data) => makeUnauthenticatedRequest('verify', data),
    onSuccess: ({ token }) => {
      saveToken({ walletAddress, token });
      updateSynthetix({ token });
    },
  });

  const logout = () => {
    window.localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="navigation">
      <div className="flexContainer">
        <h2>Synthetix node Frontend</h2>
        <div className="rightNav">
          {!walletAddress ? (
            <button type="button" onClick={connect}>
              Connect
            </button>
          ) : !token ? (
            <button type="button" onClick={() => signupMutation.mutate({ walletAddress })}>
              Login
            </button>
          ) : (
            <button type="button" onClick={logout}>
              Logout
            </button>
          )}
        </div>
      </div>
      {/* temporary solution for process tracking */}
      {`Account: ${walletAddress?.substring(0, 6)}`}
      {signupMutation.isSuccess && verificationMutation.isSuccess && <div>Signup successful</div>}
      {signupMutation.isPending || (verificationMutation.isPending && <div>Loading..</div>)}
      {signupMutation.isError && <div>Error: {signupMutation.error.message}</div>}
      {verificationMutation.isError && <div>Error: {verificationMutation.error.message}</div>}
    </div>
  );
}
