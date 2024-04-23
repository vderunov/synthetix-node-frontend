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
    enabled: permissions.data.isAdmin === true,
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
    enabled: permissions.data.isAdmin === true,
    select: (data) => data.data.wallets,
  });

  let content;
  switch (true) {
    case isLoading:
      content = <div className="skeleton-block" />;
      break;
    case permissions.data.isGranted:
      content = (
        <div className="notification is-primary">
          <h4 className="title is-4">Access granted</h4>
        </div>
      );
      break;
    case permissions.data.isPending:
      content = (
        <div className="box">
          <h4 className="title is-4">Please wait for approval</h4>
          <button
            type="button"
            className="button is-link"
            onClick={() => withdrawApplicationMutation.mutate()}
          >
            Renounce assigned role
          </button>
        </div>
      );
      break;
    default:
      content = (
        <div className="box">
          <h4 className="title is-4">Access control</h4>
          <button
            type="button"
            className="button is-link"
            onClick={() => submitApplicationMutation.mutate()}
          >
            Apply for whitelist
          </button>
        </div>
      );
  }

  return (
    <>
      <section className="section">
        <div className="container">{content}</div>
      </section>
      {permissions.data.isAdmin && !isLoading ? (
        <>
          <section className="section">
            <div className="container">
              <div className="box">
                <form className="mb-4" onSubmit={handleApproveApplicationSubmit}>
                  <div className="field">
                    <label className="label">Approve application</label>
                    <div className="control">
                      <input
                        className={`input ${userApproveWalletError && 'is-danger'}`}
                        type="text"
                        placeholder="Enter wallet address"
                        onChange={(e) => {
                          setUserApproveWalletError(false);
                          setUserApproveWallet(e.target.value);
                        }}
                      />
                    </div>
                    {userApproveWalletError ? (
                      <p className="help is-danger">This address is invalid</p>
                    ) : null}
                  </div>
                  <button
                    type="submit"
                    className="button is-link"
                    disabled={!userApproveWallet || userApproveWalletError}
                  >
                    Submit
                  </button>
                </form>
                <WalletsList
                  title="Submitted wallets"
                  data={submittedWallets.data}
                  isFetching={submittedWallets.isFetching}
                  isError={submittedWallets.isError}
                  error={submittedWallets.error}
                />
              </div>
            </div>
          </section>

          <section className="section">
            <div className="container">
              <div className="box">
                <form className="mb-4" onSubmit={handleRejectApplicationSubmit}>
                  <div className="field">
                    <label className="label">Revoke access</label>
                    <div className="control">
                      <input
                        className={`input ${userRevokeWalletError && 'is-danger'}`}
                        type="text"
                        placeholder="Enter wallet address"
                        onChange={(e) => {
                          setUserRevokeWalletError(false);
                          setUserRejectWallet(e.target.value);
                        }}
                      />
                    </div>
                    {userRevokeWalletError ? (
                      <p className="help is-danger">This address is invalid</p>
                    ) : null}
                  </div>
                  <button
                    type="submit"
                    className="button is-link"
                    disabled={!userRejectWallet || userRevokeWalletError}
                  >
                    Submit
                  </button>
                </form>
                <WalletsList
                  title="Approved wallets"
                  data={approvedWallets.data}
                  isFetching={approvedWallets.isFetching}
                  isError={approvedWallets.isError}
                />
              </div>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}

export default AccessControl;
