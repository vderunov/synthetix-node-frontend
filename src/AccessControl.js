import { useQueryClient } from '@tanstack/react-query';
import { abi, address } from '@vderunov/whitelist-contract/deployments/11155420/Whitelist';
import { Contract, ethers } from 'ethers';
import { useState } from 'react';
import usePermissions from './usePermissions';
import { useSynthetix } from './useSynthetix';

function AccessControl() {
  const queryClient = useQueryClient();
  const [synthetix] = useSynthetix();
  const permissions = usePermissions();
  const [userApproveWallet, setUserApproveWallet] = useState('');
  const [userApproveWalletError, setUserApproveWalletError] = useState('');
  const [userRevokeWallet, setUserRevokeWallet] = useState('');
  const [userRevokeWalletError, setUserRevokeWalletError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const contract = new Contract(address, abi, synthetix.signer);

  const executeContractMethod = async (method, errorHandlerMsg) => {
    setIsLoading(true);
    setLoadingText('Sending a request for permissions...');
    try {
      const tx = await method();
      await tx.wait();
      setLoadingText('Updating permissions status...');
      await queryClient.invalidateQueries({
        queryKey: [synthetix.chainId, synthetix.walletAddress, 'permissions'],
      });
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
    case isLoading || permissions.isFetching:
      content = (
        <>
          {loadingText && <p>{loadingText}</p>}
          <span className="loader" />
        </>
      );
      break;
    case permissions.data.isPending:
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
          {permissions.data.isAdmin && !permissions.isFetching && !isLoading ? (
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
