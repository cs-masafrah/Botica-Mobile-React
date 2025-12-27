import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, Address } from '@/services/auth';
import { useAuth } from './AuthContext';

export const [AddressContext, useAddress] = createContextHook(() => {
  const { isAuthenticated, customer } = useAuth();
  const queryClient = useQueryClient();

  // Query to fetch addresses
  const addressesQuery = useQuery({
    queryKey: ['addresses', customer?.id],
    queryFn: async () => {
      return authService.getAddresses();
    },
    enabled: isAuthenticated && !!customer,
    staleTime: 5 * 60 * 1000,
  });

  // Mutation to add address
  const addAddressMutation = useMutation({
    mutationFn: async (address: Omit<Address, 'id'> & {
      email: string;
      companyName?: string;
      vatId?: string;
    }) => {
      return authService.addAddress(address);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      console.log('Address added successfully');
    },
    onError: (error) => {
      console.error('Add address error:', error);
    },
  });

  // Mutation to update address
  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, address }: { id: string; address: Omit<Address, 'id'> }) => {
      return authService.updateAddress(id, address);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      console.log('Address updated successfully');
    },
    onError: (error) => {
      console.error('Update address error:', error);
    },
  });

  // Mutation to delete address
  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      await authService.deleteAddress(addressId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      console.log('Address deleted successfully');
    },
    onError: (error) => {
      console.error('Delete address error:', error);
    },
  });

  // Mutation to set default address
  const setDefaultAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      await authService.setDefaultAddress(addressId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      console.log('Default address set successfully');
    },
    onError: (error) => {
      console.error('Set default address error:', error);
    },
  });

  return {
    addresses: addressesQuery.data || [],
    isLoading: addressesQuery.isLoading,
    isError: addressesQuery.isError,
    error: addressesQuery.error,
    
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
    setDefaultAddressError: setDefaultAddressMutation.error,
    
    refetchAddresses: addressesQuery.refetch,
  };
});