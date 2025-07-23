import { useState } from 'react';
import { storageService } from '../services/storageService';
import type { UploadResult } from '../services/storageService';

export interface UseImageUploadReturn {
  uploadImage: (file: File, path?: string) => Promise<UploadResult>;
  uploadMultipleImages: (files: File[], folder?: string) => Promise<UploadResult[]>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File, path?: string): Promise<UploadResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate path if not provided
      const filePath = path || `uploads/${storageService.generateUniqueFileName(file.name)}`;
      
      const result = await storageService.uploadImage(file, filePath);
      
      if (result.error) {
        setError(result.error.message || 'Failed to upload image');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return { data: null, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  const uploadMultipleImages = async (files: File[], folder: string = 'uploads'): Promise<UploadResult[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const uploadPromises = files.map((file) => {
        const fileName = storageService.generateUniqueFileName(file.name);
        const path = `${folder}/${fileName}`;
        return storageService.uploadImage(file, path);
      });

      const results = await Promise.all(uploadPromises);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        setError(`Failed to upload ${errors.length} image(s)`);
      }
      
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    uploadImage,
    uploadMultipleImages,
    isLoading,
    error,
    clearError
  };
}; 