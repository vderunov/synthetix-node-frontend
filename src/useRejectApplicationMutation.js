import { useMutation, useQueryClient } from '@tanstack/react-query';
import { abi, address } from '@vderunov/whitelist-contract/deployments/11155420/Whitelist';
import { Contract } from 'ethers';
import { useSynthetix } from './useSynthetix';

function useRejectApplicationMutation() {
  const [synthetix] = useSynthetix();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wallet) => {
      const contract = new Contract(address, abi, synthetix.signer);
      const tx = await contract.rejectApplication(wallet);
      await tx.wait();

      queryClient.invalidateQueries({
        queryKey: [synthetix.chainId, wallet, 'permissions'],
      });
    },
    onError: console.error,
  });
}

export default useRejectApplicationMutation;
