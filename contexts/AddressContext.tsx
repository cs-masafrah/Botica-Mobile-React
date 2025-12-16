import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, Address } from '@/services/auth';
import { useAuth } from './AuthContext';

export const [AddressContext, useAddress] = createContextHook(() => {
  const { isAuthenticated, customer } = useAuth();
  const queryClient = useQueryClient();

  const addressesQuery = useQuery({
    queryKey: ['addresses', customer?.id],
    queryFn: async () => {
      const authData = await authService.getStoredAuth();
      if (!authData?.accessToken) throw new Error('Not authenticated');
      return authService.getAddresses(authData.accessToken);
    },
    enabled: isAuthenticated && !!customer,
    staleTime: 5 * 60 * 1000,
  });

  const addAddressMutation = useMutation({
    mutationFn: async (address: Omit<Address, 'id'>) => {
      const authData = await authService.getStoredAuth();
      if (!authData?.accessToken) throw new Error('Not authenticated');
      return authService.addAddress(authData.accessToken, address);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      console.log('Address added successfully');
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, address }: { id: string; address: Omit<Address, 'id'> }) => {
      const authData = await authService.getStoredAuth();
      if (!authData?.accessToken) throw new Error('Not authenticated');
      return authService.updateAddress(authData.accessToken, id, address);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      console.log('Address updated successfully');
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const authData = await authService.getStoredAuth();
      if (!authData?.accessToken) throw new Error('Not authenticated');
      await authService.deleteAddress(authData.accessToken, addressId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      console.log('Address deleted successfully');
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const authData = await authService.getStoredAuth();
      if (!authData?.accessToken) throw new Error('Not authenticated');
      await authService.setDefaultAddress(authData.accessToken, addressId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      console.log('Default address set successfully');
    },
  });

  return {
    addresses: addressesQuery.data || [],
    isLoading: addressesQuery.isLoading,
    addAddress: addAddressMutation.mutateAsync,
    updateAddress: updateAddressMutation.mutateAsync,
    deleteAddress: deleteAddressMutation.mutateAsync,
    setDefaultAddress: setDefaultAddressMutation.mutateAsync,
    isAddingAddress: addAddressMutation.isPending,
    isUpdatingAddress: updateAddressMutation.isPending,
    isDeletingAddress: deleteAddressMutation.isPending,
    isSettingDefault: setDefaultAddressMutation.isPending,
    addAddressError: addAddressMutation.error,
    updateAddressError: updateAddressMutation.error,
    deleteAddressError: deleteAddressMutation.error,
  };
});
