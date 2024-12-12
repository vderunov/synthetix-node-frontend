import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import AccessControl from './AccessControl';
import FileUploader from './FileUploader';
import FolderUploader from './FolderUploader';
import NetworkMismatchBanner from './NetworkMismatchBanner';
import usePermissions from './usePermissions';
import { useSynthetix } from './useSynthetix';
import { downloadFile, getApiUrl, saveToken } from './utils';

const makeUnauthenticatedRequest = async (endpoint, data) => {
  console.log(`/api/${endpoint}`);
  // const response = await fetch(`${getApiUrl()}${endpoint}`, {
  const response = await fetch(`/api/${endpoint}`, {
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
  const [uploadResponse, setUploadResponse] = useState(null);
  const [hash, setHash] = useState(window.localStorage.getItem('cid') ?? '');

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
    onSuccess: (data) => {
      window.localStorage.setItem('cid', data.Hash);
      setUploadResponse(data);
      setHash(data.Hash);
    },
  });

  const kuboIpfsCatFile = useQuery({
    queryKey: [synthetix.chainId, hash, 'kuboIpfsCatFile'],
    queryFn: async () => {
      const response = await fetch(`${getApiUrl()}api/v0/cat?arg=${hash}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.blob();
    },
    enabled: false,
  });

  const handleFileUploadSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('file', selectedFile);
    kuboIpfsAddMutation.mutate(formData);
  };

  const handleKuboIpfsCatFileSubmit = (event) => {
    event.preventDefault();
    kuboIpfsCatFile.refetch();
  };

  useEffect(() => {
    if (kuboIpfsCatFile.data) {
      downloadFile(kuboIpfsCatFile.data);
    }
  }, [kuboIpfsCatFile.data]);

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

      {permissions.data.isGranted && token ? (
        <>
          <FolderUploader />
          <FileUploader />
        </>
      ) : null}

      <section className="section">
        <div className="container">
          {permissions.isFetching ? (
            <div className="skeleton-block" />
          ) : permissions.data.isGranted && token ? (
            <>
              <div className="box">
                <form onSubmit={handleFileUploadSubmit}>
                  <div className="file has-name">
                    <label className="file-label">
                      <input
                        className="file-input"
                        type="file"
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
                        kuboIpfsAddMutation.isPending ? 'is-skeleton' : ''
                      }`}
                      disabled={!selectedFile}
                    >
                      Submit
                    </button>
                  </div>
                </form>
                {uploadResponse ? (
                  <pre className="mt-4">{JSON.stringify(uploadResponse, null, 2)}</pre>
                ) : null}

                <form onSubmit={handleKuboIpfsCatFileSubmit} className="mt-5">
                  <div className="field">
                    <label className="label">IPFS hash(CID)</label>
                    <input
                      className="input"
                      type="text"
                      placeholder="Example: QmRjX3..."
                      value={hash}
                      onChange={({ target }) => setHash(target.value)}
                    />
                    {kuboIpfsCatFile.isError ? (
                      <p className="help is-danger">{kuboIpfsCatFile.error.message}</p>
                    ) : null}
                  </div>
                  <button
                    type="submit"
                    className={`button is-link ${kuboIpfsCatFile.isFetching ? 'is-skeleton' : ''}`}
                    disabled={!hash}
                  >
                    Download
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="box">
              <h2 className="subtitle">
                Please <strong>login</strong> and <strong>request</strong> access permissions to use
              </h2>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
