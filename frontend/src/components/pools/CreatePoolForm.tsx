/**
 * Pool creation form component
 */

'use client';

import { useState } from 'react';
import { parseEther } from 'viem';
import { useCreatePool } from '@/hooks/useNanoPool';
import { useAuthStore } from '@/store/auth';
import { defaultChainId } from '@/lib/viem';

interface CreatePoolFormProps {
  onSuccess?: (poolId: number) => void;
  onCancel?: () => void;
}

export function CreatePoolForm({ onSuccess, onCancel }: CreatePoolFormProps) {
  const [formData, setFormData] = useState({
    beneficiary: '',
    description: '',
    goalAmount: '',
    duration: '7', // days
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { createPool, loading, error } = useCreatePool(defaultChainId);
  const { walletAddress, isAuthenticated } = useAuthStore();

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.beneficiary.trim()) {
      newErrors.beneficiary = 'Beneficiary address is required';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.beneficiary)) {
      newErrors.beneficiary = 'Invalid Ethereum address';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.goalAmount.trim()) {
      newErrors.goalAmount = 'Goal amount is required';
    } else {
      const amount = parseFloat(formData.goalAmount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.goalAmount = 'Goal amount must be a positive number';
      } else if (amount > 1000) {
        newErrors.goalAmount = 'Goal amount cannot exceed 1000 ETH';
      }
    }

    const duration = parseInt(formData.duration);
    if (isNaN(duration) || duration < 1 || duration > 365) {
      newErrors.duration = 'Duration must be between 1 and 365 days';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const goalAmount = parseEther(formData.goalAmount);
      const deadlineTimestamp = BigInt(
        Math.floor(Date.now() / 1000) + parseInt(formData.duration) * 24 * 60 * 60
      );

      const result = await createPool({
        beneficiary: formData.beneficiary as `0x${string}`,
        description: formData.description,
        goalAmount,
        deadlineTimestamp,
      });

      if (result.poolId && onSuccess) {
        onSuccess(result.poolId);
      }

      // Reset form
      setFormData({
        beneficiary: '',
        description: '',
        goalAmount: '',
        duration: '7',
      });
    } catch (err) {
      console.error('Failed to create pool:', err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Wallet Connection Required
        </h3>
        <p className="text-yellow-700">
          Please connect your wallet to create a pool.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Pool</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Beneficiary Address */}
        <div>
          <label htmlFor="beneficiary" className="block text-sm font-medium text-gray-700 mb-2">
            Beneficiary Address
          </label>
          <input
            type="text"
            id="beneficiary"
            value={formData.beneficiary}
            onChange={(e) => handleInputChange('beneficiary', e.target.value)}
            placeholder="0x..."
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.beneficiary ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.beneficiary && (
            <p className="mt-1 text-sm text-red-600">{errors.beneficiary}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            The address that will receive funds when the goal is reached
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Pool Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe what this pool is for..."
            rows={4}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.description.length}/500 characters
          </p>
        </div>

        {/* Goal Amount */}
        <div>
          <label htmlFor="goalAmount" className="block text-sm font-medium text-gray-700 mb-2">
            Goal Amount (ETH)
          </label>
          <input
            type="number"
            id="goalAmount"
            value={formData.goalAmount}
            onChange={(e) => handleInputChange('goalAmount', e.target.value)}
            placeholder="0.1"
            step="0.001"
            min="0"
            max="1000"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.goalAmount ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.goalAmount && (
            <p className="mt-1 text-sm text-red-600">{errors.goalAmount}</p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            Duration (days)
          </label>
          <select
            id="duration"
            value={formData.duration}
            onChange={(e) => handleInputChange('duration', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.duration ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="7">1 week</option>
            <option value="14">2 weeks</option>
            <option value="30">1 month</option>
            <option value="90">3 months</option>
          </select>
          {errors.duration && (
            <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating Pool...
              </span>
            ) : (
              'Create Pool'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
