import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useSynthetix } from './useSynthetix';

function AccessControl() {
  const [synthetix, updateSynthetix] = useSynthetix();
  const { contract, permissions, walletAddress } = synthetix;
  const [userApproveWallet, setUserApproveWallet] = useState('');
  const [userApproveWalletError, setUserApproveWalletError] = useState('');
  const [userRevokeWallet, setUserRevokeWallet] = useState('');
  const [userRevokeWalletError, setUserRevokeWalletError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('');

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const fetchPermissions = useCallback(async () => {
    if (!contract || !walletAddress) {
      setIsLoading(false);
      return;
    }

    const [isPending, isGranted, isAdmin] = await Promise.all([
      contract.isPending(walletAddress),
      contract.isGranted(walletAddress),
      contract.isAdmin(walletAddress),
    ]);

    updateSynthetix({
      permissions: {
        isPending,
        isGranted,
        isAdmin,
      },
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const executeContractMethod = async (method, errorHandlerMsg) => {
    setIsLoading(true);
    setLoadingText('Sending a request for permissions...');
    try {
      const tx = await method();
      await tx.wait();
      setLoadingText('Updating permissions status...');
      await fetchPermissions();
    } catch (error) {
      console.error(`${errorHandlerMsg} `, error);
    } finally {
      setLoadingText('');
      setIsLoading(false);
    }
  };

  const handleApproveApplicationSubmit = async (e) => {
    e.preventDefault();

    if (ethers.isAddress(userApproveWallet)) {
      executeContractMethod(
        () => contract.approveApplication(userApproveWallet),
        'An error occurred when handling the submit:'
      );
    } else {
      setUserApproveWalletError('Invalid wallet address');
    }
  };

  const handleRevokeAccessSubmit = async (e) => {
    e.preventDefault();

    if (ethers.isAddress(userApproveWallet)) {
      executeContractMethod(
        () => contract.revokeAccess(userRevokeWallet),
        'An error occurred when handling the submit:'
      );
    } else {
      setUserRevokeWalletError('Invalid wallet address');
    }
  };

  const handleApplyForWhitelist = () => {
    executeContractMethod(
      contract.applyForWhitelist,
      'An error occurred when applying for whitelist:'
    );
  };

  const handleRenounceAssignedRole = () => {
    executeContractMethod(
      contract.renounceAssignedRole,
      'An error occurred when renouncing assigned role:'
    );
  };

  let content;
  switch (true) {
    case isLoading:
      content = (
        <>
          {loadingText && <p>{loadingText}</p>}
          <span className="loader" />
        </>
      );
      break;
    case permissions?.isPending:
      content = (
        <>
          <h3>Please wait for approval</h3>
          <button type="button" className="danger" onClick={handleRenounceAssignedRole}>
            Renounce assigned role
          </button>
        </>
      );
      break;
    default:
      content = (
        <>
          <h3>Access control</h3>
          <button type="button" onClick={handleApplyForWhitelist}>
            Apply for whitelist
          </button>
        </>
      );
  }

  return (
    <div className="block">
      <div className="container">
        <div className="inner-block">{content}</div>
        <div className="inner-block">
          {permissions?.isAdmin && !isLoading ? (
            <>
              <h3>Approve application (only Admin)</h3>
              <form onSubmit={handleApproveApplicationSubmit} className="admin-form">
                <input
                  type="text"
                  value={userApproveWallet}
                  onChange={(e) => {
                    setUserApproveWalletError('');
                    setUserApproveWallet(e.target.value);
                  }}
                  placeholder="Enter wallet address"
                />
                {userApproveWalletError && (
                  <p className="invalid-address">{userApproveWalletError}</p>
                )}
                <button type="submit" disabled={!userApproveWallet || userApproveWalletError}>
                  Submit
                </button>
              </form>

              <hr />

              <h3>Revoke access (only Admin)</h3>
              <form onSubmit={handleRevokeAccessSubmit} className="admin-form">
                <input
                  type="text"
                  value={userRevokeWallet}
                  onChange={(e) => {
                    setUserRevokeWalletError('');
                    setUserRevokeWallet(e.target.value);
                  }}
                  placeholder="Enter wallet address"
                />
                {userRevokeWalletError && (
                  <p className="invalid-address">{userRevokeWalletError}</p>
                )}
                <button
                  type="submit"
                  className="danger"
                  disabled={!userRevokeWallet || userRevokeWalletError}
                >
                  Revoke access
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default AccessControl;
