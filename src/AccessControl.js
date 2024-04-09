import { ethers } from 'ethers';
import { useState } from 'react';
import useApplyForWhitelistMutation from './useApplyForWhitelistMutation';
import useApproveApplicationMutation from './useApproveApplicationMutation';
import usePermissions from './usePermissions';
import useRenounceAssignedRoleMutation from './useRenounceAssignedRoleMutation';
import useRevokeAccessMutation from './useRevokeAccessMutation';

function AccessControl() {
  const [userApproveWallet, setUserApproveWallet] = useState('');
  const [userApproveWalletError, setUserApproveWalletError] = useState('');
  const [userRevokeWallet, setUserRevokeWallet] = useState('');
  const [userRevokeWalletError, setUserRevokeWalletError] = useState('');

  const permissions = usePermissions();
  const approveApplicationMutation = useApproveApplicationMutation();
  const revokeAccessMutation = useRevokeAccessMutation();
  const applyForWhitelistMutation = useApplyForWhitelistMutation();
  const renounceAssignedRoleMutation = useRenounceAssignedRoleMutation();

  const isLoading =
    permissions.isFetching ||
    approveApplicationMutation.isPending ||
    revokeAccessMutation.isPending ||
    applyForWhitelistMutation.isPending ||
    renounceAssignedRoleMutation.isPending;

  const handleApproveApplicationSubmit = async (e) => {
    e.preventDefault();

    if (ethers.isAddress(userApproveWallet)) {
      approveApplicationMutation.mutate(userApproveWallet);
    } else {
      setUserApproveWalletError('Invalid wallet address');
    }
  };

  const handleRevokeAccessSubmit = async (e) => {
    e.preventDefault();

    if (ethers.isAddress(userRevokeWallet)) {
      revokeAccessMutation.mutate(userRevokeWallet);
    } else {
      setUserRevokeWalletError('Invalid wallet address');
    }
  };

  let content;
  switch (true) {
    case isLoading:
      content = <span className="loader" />;
      break;
    case permissions.data.isPending:
      content = (
        <>
          <h3>Please wait for approval</h3>
          <button
            type="button"
            className="danger"
            onClick={() => renounceAssignedRoleMutation.mutate()}
          >
            Renounce assigned role
          </button>
        </>
      );
      break;
    default:
      content = (
        <>
          <h3>Access control</h3>
          <button type="button" onClick={() => applyForWhitelistMutation.mutate()}>
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
          {permissions.data.isAdmin && !isLoading ? (
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
