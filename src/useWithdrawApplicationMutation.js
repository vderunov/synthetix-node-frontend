import { useMutation, useQueryClient } from '@tanstack/react-query';
import { abi, address } from '@vderunov/whitelist-contract/deployments/11155420/Whitelist';
import { Contract } from 'ethers';
import { useSynthetix } from './useSynthetix';

function useWithdrawApplicationMutation() {
  const [synthetix] = useSynthetix();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const contract = new Contract(address, abi, synthetix.signer);
      const tx = await contract.withdrawApplication();
      await tx.wait();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [synthetix.chainId, synthetix.walletAddress, 'permissions'],
      });
    },
    onError: console.error,
  });
}

export default useWithdrawApplicationMutation;
