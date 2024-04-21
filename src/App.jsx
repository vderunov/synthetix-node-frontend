import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import AccessControl from './AccessControl';
import NetworkMismatchBanner from './NetworkMismatchBanner';
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
  const { walletAddress, token, logout, connect, signer } = synthetix;
  const permissions = usePermissions();
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

  return (
    <>
      <NetworkMismatchBanner />
      <header>
        <nav className="navbar" aria-label="main navigation">
          <div className="navbar-start">
            <div className="navbar-item">
              <h3 className="title is-3">Synthetix node Frontend</h3>
            </div>
          </div>
          <div className="navbar-end">
            <div className="navbar-item">
              <div className="buttons">
                {walletAddress && token ? (
                  <button type="button" className="button is-warning" onClick={logout}>
                    Log Out
                  </button>
                ) : null}

                {walletAddress && !token ? (
                  <>
                    <button
                      type="button"
                      className="button is-light"
                      onClick={() => signupMutation.mutate({ walletAddress })}
                    >
                      Log In
                    </button>
                    <button type="button" className="button is-warning" onClick={logout}>
                      Disconnect
                    </button>
                  </>
                ) : null}

                {!walletAddress && !token ? (
                  <button
                    type="button"
                    className="button is-light"
                    onClick={async () => updateSynthetix(await connect())}
                  >
                    Connect
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {walletAddress && token ? <AccessControl /> : null}

      <section className="section">
        <div className="container">
          {permissions.isFetching ? (
            <div className="skeleton-block" />
          ) : permissions.data.isGranted && token ? (
            <div className="box">
              <form onSubmit={handleFileUploadSubmit}>
                <div className="file has-name">
                  <label className="file-label">
                    <input
                      className="file-input"
                      type="file"
                      accept=".png"
                      onChange={({ target }) => {
                        setSelectedFile(target.files[0]);
                        setFileName(target.files[0]?.name);
                      }}
                    />
                    <span className="file-cta">
                      <span className="file-label">Choose a file…</span>
                    </span>
                    <span className="file-name">{fileName}</span>
                  </label>
                </div>
                <div className="control">
                  <button
                    type="submit"
                    className={`button is-link ${
                      kuboIpfsAddMutation.isPending || kuboIpfsCatMutation.isPending
                        ? 'is-skeleton'
                        : ''
                    }`}
                    disabled={!selectedFile}
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="box">
              <h2 className="subtitle">
                Please <strong>login</strong> and <strong>request</strong> access permissions to use
              </h2>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          {image ? (
            <figure className="image">
              <img
                src={image}
                alt="User uploaded file"
                style={{ maxWidth: '500px', maxHeight: '500px', width: 'auto', height: 'auto' }}
              />
            </figure>
          ) : null}
        </div>
      </section>
    </>
  );
}
