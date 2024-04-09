import { useQuery } from '@tanstack/react-query';
import { abi, address } from '@vderunov/whitelist-contract/deployments/11155420/Whitelist';
import { Contract } from 'ethers';
import { useSynthetix } from './useSynthetix';

function usePermissions() {
  const [synthetix] = useSynthetix();
  const contract = new Contract(address, abi, synthetix.provider);

  return useQuery({
    queryKey: [synthetix.chainId, synthetix.walletAddress, 'permissions'],
    queryFn: async () => {
      const [isPending, isGranted, isAdmin] = await Promise.all([
        contract.isPending(synthetix.walletAddress),
        contract.isGranted(synthetix.walletAddress),
        contract.isAdmin(synthetix.walletAddress),
      ]);

      return { isPending, isGranted, isAdmin };
    },
    enabled: !!synthetix.walletAddress,
    initialData: {
      isPending: undefined,
      isGranted: undefined,
      isAdmin: undefined,
    },
  });
}

export default usePermissions;
