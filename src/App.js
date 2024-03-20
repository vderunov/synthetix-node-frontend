import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useSynthetix } from './useSynthetix';
import { getApiUrl, getIpfsUrl, saveToken } from './utils';

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
      const response = await fetch(`${getIpfsUrl()}api/v0/add`, {
        method: 'POST',
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
    mutationFn: (ipfsPath) => makeUnauthenticatedRequest(`api/v0/cat?arg=${ipfsPath}`),
    onSuccess: setImage,
  });

  const handleFormSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('file', selectedFile);
    kuboIpfsAddMutation.mutate(formData);
  };

  return (
    <div className="navigation">
      <div className="flexContainer">
        <h2>Synthetix node Frontend</h2>
        <div className="rightNav">
          {walletAddress && token ? (
            <button type="button" onClick={logout}>
              Logout
            </button>
          ) : null}

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

      {/* before realization on the backend */}
      {token ? (
        <form onSubmit={handleFormSubmit}>
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
      ) : null}
      {image ? <img src={image} alt="User uploaded file" /> : null}
      {/* temporary solution for process tracking */}
      <h2>{`Account: ${walletAddress?.substring(0, 6)}`}</h2>
      {signupMutation.isSuccess && verificationMutation.isSuccess && <div>Signup successful</div>}
      {signupMutation.isPending || (verificationMutation.isPending && <div>Loading..</div>)}
      {signupMutation.isError && <div>Error: {signupMutation.error.message}</div>}
      {verificationMutation.isError && <div>Error: {verificationMutation.error.message}</div>}
      {kuboIpfsAddMutation.isPending && <div>Uploading file...</div>}
      {kuboIpfsAddMutation.isSuccess && <div>File uploaded successfully</div>}
      {kuboIpfsAddMutation.isError && <div>Error uploading file: {addMutation.error.message}</div>}
      <pre>{JSON.stringify(kuboIpfsAddMutation.data, null, 2)}</pre>
    </div>
  );
}
