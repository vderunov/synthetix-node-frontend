import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import AccessControl from './AccessControl';
import Banner from './Banner';
import usePermissions from './usePermissions';
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

  if (response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }
  throw new Error('Network response was not ok');
};

export function App() {
  const [synthetix, updateSynthetix] = useSynthetix();
  const { walletAddress, token, logout, connect, signer, chainId } = synthetix;
  const permissions = usePermissions();
  const fileUpload = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [image, setImage] = useState('');

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

  const kuboIpfsAddMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`${getApiUrl()}api/v0/add`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    onSuccess: ({ Hash }) => {
      window.localStorage.setItem('cid', Hash);
      kuboIpfsCatMutation.mutate(Hash);
    },
  });

  const kuboIpfsCatMutation = useMutation({
    mutationFn: async (ipfsPath) => {
      const response = await fetch(`${getApiUrl()}api/v0/cat?arg=${ipfsPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.blob();
    },
    onSuccess: (data) => setImage(URL.createObjectURL(data)),
  });

  const handleFileUploadSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('file', selectedFile);
    kuboIpfsAddMutation.mutate(formData);
  };

  const handleSwitchChain = async () => {
    await window.ethereum?.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${Number(11155420).toString(16)}` }],
    });
  };

  return (
    <div>
      <Banner />
      <div className="navigation">
        <div className="flexContainer">
          <h2>Synthetix node Frontend</h2>
          <div className="rightNav">
            {walletAddress && token ? (
              <button type="button" onClick={logout}>
                Logout
              </button>
            ) : null}

            {`0x${Number(11155420).toString(16)}` === chainId ? null : (
              <button type="button" onClick={handleSwitchChain}>
                Change chain to OP Sepolia
              </button>
            )}

            {walletAddress && !token ? (
              <>
                <button type="button" onClick={() => signupMutation.mutate({ walletAddress })}>
                  Login
                </button>
                <button type="button" onClick={logout}>
                  Disconnect
                </button>
              </>
            ) : null}

            {!walletAddress && !token ? (
              <button type="button" onClick={async () => updateSynthetix(await connect())}>
                Connect
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="container">
        <div className="block">
          {permissions.data.isGranted && token ? (
            <form onSubmit={handleFileUploadSubmit}>
              <div>
                <button type="button" onClick={() => fileUpload.current.click()}>
                  Select File
                </button>
                <input
                  type="file"
                  accept=".png"
                  ref={fileUpload}
                  onChange={({ target }) => {
                    setSelectedFile(target.files[0]);
                    setFileName(target.files[0].name);
                  }}
                  style={{ display: 'none' }}
                />
                {fileName && <div>Selected file: {fileName}</div>}
              </div>
              <button type="submit" disabled={!selectedFile}>
                Submit
              </button>
            </form>
          ) : (
            <h3>Please login and request access permissions to use</h3>
          )}
        </div>
        {walletAddress && token ? <AccessControl /> : null}
      </div>
      {image ? <img src={image} alt="User uploaded file" /> : null}
      {/* temporary solution for process tracking */}
      <div
        style={{
          border: '2px solid orange',
          backgroundColor: 'rgba(255, 165, 0, 0.2)',
          padding: '0.4em',
          marginBottom: '0.4em',
          borderRadius: '0.4em',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          overflow: 'auto',
          maxHeight: '40%',
        }}
      >
        <h5>debugging info block</h5>
        <h5>{`Account: ${walletAddress?.substring(0, 6)}`}</h5>
        <h5>{`Chain ID: ${chainId}(${
          chainId === `0x${Number(11155420).toString(16)}` ? 'OP Sepolia' : 'other'
        })`}</h5>
        {signupMutation.isSuccess && verificationMutation.isSuccess && <div>Signup successful</div>}
        {signupMutation.isPending || (verificationMutation.isPending && <div>Loading..</div>)}
        {signupMutation.isError && <div>Error: {signupMutation.error.message}</div>}
        {verificationMutation.isError && <div>Error: {verificationMutation.error.message}</div>}
        {kuboIpfsAddMutation.isPending && <div>Uploading file...</div>}
        {kuboIpfsAddMutation.isSuccess && <div>File uploaded successfully</div>}
        {kuboIpfsAddMutation.isError && (
          <div>Error uploading file: {kuboIpfsAddMutation.error.message}</div>
        )}
        <pre>{JSON.stringify(kuboIpfsAddMutation.data, null, 2)}</pre>
      </div>
    </div>
  );
}
