import { useMutation } from '@tanstack/react-query';
import { useSynthetix } from './useSynthetix';

export function App() {
  const [synthetix, updateSynthetix] = useSynthetix();
  const { walletAddress, connect, signature } = synthetix;

  const { mutate, isPending, isError, error, isSuccess } = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('http://localhost:3005/signup', {
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
    },
    onSuccess: ({ signature }) => updateSynthetix({ signature }),
  });

  return (
    <div className="navigation">
      <div className="flexContainer">
        <h2>Synthetix node Frontend</h2>
        <div className="rightNav">
          {!walletAddress ? (
            <button type="button" onClick={connect}>
              Connect
            </button>
          ) : !signature ? (
            <button type="button" onClick={() => mutate({ walletAddress })}>
              Login
            </button>
          ) : (
            <button type="button" onClick={() => {}}>
              Logout
            </button>
          )}
        </div>
      </div>
      {isSuccess && <div>Signup successful</div>}
      {isPending && <div>Loading..</div>}
      {isError && <div>Error: {error.message}</div>}
    </div>
  );
}
