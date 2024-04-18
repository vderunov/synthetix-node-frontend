import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useState } from 'react';
import WalletsList from './WalletsList';
import useApproveApplicationMutation from './useApproveApplicationMutation';
import usePermissions from './usePermissions';
import useRejectApplicationMutation from './useRejectApplicationMutation';
import useSubmitApplicationMutation from './useSubmitApplicationMutation';
import { useSynthetix } from './useSynthetix';
import useWithdrawApplicationMutation from './useWithdrawApplicationMutation';
import { getApiUrl } from './utils';

function AccessControl() {
  const [synthetix] = useSynthetix();
  const queryClient = useQueryClient();
  const [userApproveWallet, setUserApproveWallet] = useState('');
  const [userApproveWalletError, setUserApproveWalletError] = useState(false);
  const [userRejectWallet, setUserRejectWallet] = useState('');
  const [userRevokeWalletError, setUserRevokeWalletError] = useState(false);

  const permissions = usePermissions();
  const approveApplicationMutation = useApproveApplicationMutation();
  const rejectApplicationMutation = useRejectApplicationMutation();
  const submitApplicationMutation = useSubmitApplicationMutation();
  const withdrawApplicationMutation = useWithdrawApplicationMutation();

  const isLoading =
    permissions.isFetching ||
    approveApplicationMutation.isPending ||
    rejectApplicationMutation.isPending ||
    submitApplicationMutation.isPending ||
    withdrawApplicationMutation.isPending;

  const handleApproveApplicationSubmit = async (e) => {
    e.preventDefault();

    if (ethers.isAddress(userApproveWallet)) {
      approveApplicationMutation.mutate(userApproveWallet, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [synthetix.chainId, 'approved-wallets'] });
          queryClient.invalidateQueries({ queryKey: [synthetix.chainId, 'submitted-wallets'] });
        },
      });
    } else {
      setUserApproveWalletError(true);
    }
  };

  const handleRejectApplicationSubmit = async (e) => {
    e.preventDefault();

    if (ethers.isAddress(userRejectWallet)) {
      rejectApplicationMutation.mutate(userRejectWallet);
    } else {
      setUserRevokeWalletError(true);
    }
  };

  const approvedWallets = useQuery({
    queryKey: [synthetix.chainId, 'approved-wallets'],
    queryFn: async () => {
      const response = await fetch(`${getApiUrl()}approved-wallets`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${synthetix.token}` },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    enabled: !!permissions.data.isAdmin,
    select: (data) => data.data.wallets,
  });

  const submittedWallets = useQuery({
    queryKey: [synthetix.chainId, 'submitted-wallets'],
    queryFn: async () => {
      const response = await fetch(`${getApiUrl()}submitted-wallets`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${synthetix.token}` },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    enabled: !!permissions.data.isAdmin,
    select: (data) => data.data.wallets,
  });

  let content;
  switch (true) {
    case isLoading:
      content = <progress className="s12 m12 s12" />;
      break;
    case permissions.data.isGranted:
      content = <h5 className="s12 m12 s12 center-align">Access granted</h5>;
      break;
    case permissions.data.isPending:
      content = (
        <>
          <h5 className="s12 m12 s12 center-align">Please wait for approval</h5>
          <button
            type="button"
            className="transparent s12 m12 s12"
            onClick={() => withdrawApplicationMutation.mutate()}
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
            onClick={() => submitApplicationMutation.mutate()}
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
        <div className="s12 m6 l4 medium-padding fill bottom-shadow">
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

          <form className="medium-padding" onSubmit={handleRejectApplicationSubmit}>
            <div className={`field label border ${userRevokeWalletError && 'invalid'}`}>
              <input
                type="text"
                value={userRejectWallet}
                onChange={(e) => {
                  setUserRevokeWalletError(false);
                  setUserRejectWallet(e.target.value);
                }}
              />
              <label>Enter wallet address</label>
              <span className={userRevokeWalletError ? 'error' : 'helper'}>Revoke access</span>
            </div>
            <button
              type="submit"
              className="transparent"
              disabled={!userRejectWallet || userRevokeWalletError}
            >
              Submit
            </button>

            <hr />

            <WalletsList
              title="Approved wallets"
              data={approvedWallets.data}
              isFetching={approvedWallets.isFetching}
              isError={approvedWallets.isError}
            />
            <WalletsList
              title="Submitted wallets"
              data={submittedWallets.data}
              isFetching={submittedWallets.isFetching}
              isError={submittedWallets.isError}
            />
          </form>
        </div>
      ) : null}
    </>
  );
}

export default AccessControl;
