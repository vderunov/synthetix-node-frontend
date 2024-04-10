import { ethers } from 'ethers';
import { useState } from 'react';
import useApplyForWhitelistMutation from './useApplyForWhitelistMutation';
import useApproveApplicationMutation from './useApproveApplicationMutation';
import usePermissions from './usePermissions';
import useRenounceAssignedRoleMutation from './useRenounceAssignedRoleMutation';
import useRevokeAccessMutation from './useRevokeAccessMutation';

function AccessControl() {
  const [userApproveWallet, setUserApproveWallet] = useState('');
  const [userApproveWalletError, setUserApproveWalletError] = useState(false);
  const [userRevokeWallet, setUserRevokeWallet] = useState('');
  const [userRevokeWalletError, setUserRevokeWalletError] = useState(false);

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
      setUserApproveWalletError(true);
    }
  };

  const handleRevokeAccessSubmit = async (e) => {
    e.preventDefault();

    if (ethers.isAddress(userRevokeWallet)) {
      revokeAccessMutation.mutate(userRevokeWallet);
    } else {
      setUserRevokeWalletError(true);
    }
  };

  let content;
  switch (true) {
    case isLoading:
      content = <progress className="s12 m12 s12" />;
      break;
    case permissions.data.isPending:
      content = (
        <>
          <h5 className="s12 m12 s12 center-align">Please wait for approval</h5>
          <button
            type="button"
            className="transparent s12 m12 s12"
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
          <h5 className="s12 m12 s12 center-align">Access control</h5>
          <button
            type="button"
            className="transparent s12 m12 s12"
            onClick={() => applyForWhitelistMutation.mutate()}
          >
            Apply for whitelist
          </button>
        </>
      );
  }

  return (
    <>
      <div className="s12 m6 l4 medium-padding fill bottom-shadow medium-height">
        <div className="grid">{content}</div>
      </div>
      {permissions.data.isAdmin && !isLoading ? (
        <div className="s12 m6 l4 medium-padding fill bottom-shadow medium-height">
          <h5 className="center-align">Only for Admin</h5>
          <form className="medium-padding" onSubmit={handleApproveApplicationSubmit}>
            <div className={`field label border ${userApproveWalletError && 'invalid'}`}>
              <input
                type="text"
                value={userApproveWallet}
                onChange={(e) => {
                  setUserApproveWalletError(false);
                  setUserApproveWallet(e.target.value);
                }}
              />
              <label>Enter wallet address</label>
              <span className={userApproveWalletError ? 'error' : 'helper'}>
                Approve application
              </span>
            </div>
            <button
              type="submit"
              className="transparent"
              disabled={!userApproveWallet || userApproveWalletError}
            >
              Submit
            </button>
          </form>

          <form className="medium-padding" onSubmit={handleRevokeAccessSubmit}>
            <div className={`field label border ${userRevokeWalletError && 'invalid'}`}>
              <input
                type="text"
                value={userRevokeWallet}
                onChange={(e) => {
                  setUserRevokeWalletError(false);
                  setUserRevokeWallet(e.target.value);
                }}
              />
              <label>Enter wallet address</label>
              <span className={userRevokeWalletError ? 'error' : 'helper'}>Revoke access</span>
            </div>
            <button
              type="submit"
              className="transparent"
              disabled={!userRevokeWallet || userRevokeWalletError}
            >
              Submit
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}

export default AccessControl;
