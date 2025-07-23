import React, { useState } from 'react';
import { storageService } from '../services/storageService';

export const StorageTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult('Testing connection...');

    try {
      // Test listing files (this will verify the connection)
      const result = await storageService.listImages();
      
      if (result.error) {
        setTestResult(`Connection failed: ${result.error.message}`);
      } else {
        setTestResult(`Connection successful! Found ${result.data?.length || 0} files in bucket.`);
      }
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setTestResult('Uploading test file...');

    try {
      const result = await storageService.uploadImage(file, 'test/test-image.jpg');
      
      if (result.error) {
        setTestResult(`Upload failed: ${result.error.message}`);
      } else {
        const imageUrl = storageService.getImageUrl(result.data.path);
        setTestResult(`Upload successful! Image URL: ${imageUrl}`);
      }
    } catch (error) {
      setTestResult(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Storage Connection Test</h2>
      
      <div className="space-y-4">
        <button
          onClick={testConnection}
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Connection'}
        </button>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Upload
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={testUpload}
            disabled={isLoading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
          />
        </div>

        {testResult && (
          <div className={`p-4 rounded-lg ${
            testResult.includes('successful') 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : testResult.includes('failed') || testResult.includes('Error')
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            <p className="text-sm">{testResult}</p>
          </div>
        )}
      </div>
    </div>
  );
}; 