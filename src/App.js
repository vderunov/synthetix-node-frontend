import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import AccessControl from './AccessControl';
import NetworkMismatchSnackbar from './NetworkMismatchSnackbar';
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
    <>
      <header>
        <nav className="m l">
          <h5>Synthetix node Frontend</h5>
          <div className="max" />
          {walletAddress && token ? (
            <button type="button" className="transparent" onClick={logout}>
              Logout
            </button>
          ) : null}

          {`0x${Number(11155420).toString(16)}` === chainId ? null : (
            <button type="button" className="transparent" onClick={handleSwitchChain}>
              Change chain to OP Sepolia
            </button>
          )}

          {walletAddress && !token ? (
            <>
              <button
                type="button"
                className="transparent"
                onClick={() => signupMutation.mutate({ walletAddress })}
              >
                Login
              </button>
              <button type="button" className="transparent" onClick={logout}>
                Disconnect
              </button>
            </>
          ) : null}

          {!walletAddress && !token ? (
            <button
              type="button"
              className="transparent"
              onClick={async () => updateSynthetix(await connect())}
            >
              Connect
            </button>
          ) : null}
        </nav>

        <nav className="s">
          {walletAddress && token ? (
            <button type="button" className="transparent" onClick={logout}>
              Logout
            </button>
          ) : null}

          {`0x${Number(11155420).toString(16)}` === chainId ? null : (
            <button type="button" className="transparent" onClick={handleSwitchChain}>
              Change chain to OP Sepolia
            </button>
          )}

          {walletAddress && !token ? (
            <>
              <button
                type="button"
                className="transparent"
                onClick={() => signupMutation.mutate({ walletAddress })}
              >
                Login
              </button>
              <button type="button" className="transparent" onClick={logout}>
                Disconnect
              </button>
            </>
          ) : null}

          {!walletAddress && !token ? (
            <button
              type="button"
              className="transparent"
              onClick={async () => updateSynthetix(await connect())}
            >
              Connect
            </button>
          ) : null}
        </nav>
      </header>

      <main className="responsive">
        <div className="grid medium-height">
          <div className="s12 m6 l4 medium-padding fill bottom-shadow medium-height">
            {permissions.data.isGranted && token ? (
              <form className="grid medium-padding" onSubmit={handleFileUploadSubmit}>
                <button
                  type="button"
                  className="transparent s12 m12 s12"
                  onClick={() => fileUpload.current.click()}
                >
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
                {fileName && (
                  <div className="s12 m12 s12 center-align">Selected file: {fileName}</div>
                )}
                <button type="submit" className="transparent s12 m12 s12" disabled={!selectedFile}>
                  Submit
                </button>
              </form>
            ) : (
              <h5 className="center-align">Please login and request access permissions to use</h5>
            )}
          </div>

          {walletAddress && token ? <AccessControl /> : null}
          {image ? (
            <div className="s12 m12 l12">
              <img src={image} alt="User uploaded file" className="responsive" />
            </div>
          ) : null}
        </div>
      </main>
      <NetworkMismatchSnackbar />
    </>
  );
}
