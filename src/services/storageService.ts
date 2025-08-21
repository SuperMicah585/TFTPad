import { supabase } from '../lib/supabase';

export interface UploadResult {
  data: any;
  error: any;
}

export class StorageService {
  private bucketName = 'study-group-icons';
  private apiBaseUrl = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';

  /**
   * Upload an image file through the backend API
   */
  async uploadImage(file: File, path: string): Promise<UploadResult> {
    try {
      
      
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);
      formData.append('bucket', this.bucketName);
      
      // Upload through backend API
      const response = await fetch(`${this.apiBaseUrl}/api/upload-image`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('StorageService: Upload error:', errorData);
        return { data: null, error: errorData };
      }
      
      const result = await response.json();

      return { data: { path: result.path, url: result.url }, error: null };
    } catch (error) {
      console.error('StorageService: Upload error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a public URL for an image
   */
  getImageUrl(path: string): string {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Delete an image from storage through the backend API
   */
  async deleteImage(path: string): Promise<UploadResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/delete-image`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, bucket: this.bucketName }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData };
      }
      
      const result = await response.json();
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * List all images in a folder
   */
  async listImages(folder: string = ''): Promise<UploadResult> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(folder);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Generate a unique filename
   */
  generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
  }
}

export const storageService = new StorageService(); 