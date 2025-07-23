import React, { useRef, useState } from 'react';
import { useImageUpload } from '../hooks/useImageUpload';
import { storageService } from '../services/storageService';

export const ImageUploadExample: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploadMultipleImages, isLoading, error, clearError } = useImageUpload();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const handleSingleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await uploadImage(file);
    if (result.data && !result.error) {
      const imageUrl = storageService.getImageUrl(result.data.path);
      setUploadedImages(prev => [...prev, imageUrl]);
    }
  };

  const handleMultipleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const results = await uploadMultipleImages(files);
    const newImageUrls = results
      .filter(result => result.data && !result.error)
      .map(result => storageService.getImageUrl(result.data.path));
    
    setUploadedImages(prev => [...prev, ...newImageUrls]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const results = await uploadMultipleImages(files);
    const newImageUrls = results
      .filter(result => result.data && !result.error)
      .map(result => storageService.getImageUrl(result.data.path));
    
    setUploadedImages(prev => [...prev, ...newImageUrls]);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Image Upload Example</h2>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={clearError}
            className="text-red-500 hover:text-red-700 text-sm mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-600">Uploading images...</p>
        </div>
      )}

      {/* Upload Methods */}
      <div className="space-y-4 mb-6">
        {/* Single File Upload */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Single Image Upload</h3>
          <input
            type="file"
            accept="image/*"
            onChange={handleSingleUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Multiple File Upload */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Multiple Images Upload</h3>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleMultipleUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Drag and Drop */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Drag and Drop</h3>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
          >
            <p className="text-gray-600">Drag and drop images here</p>
            <p className="text-sm text-gray-500 mt-2">or click to select files</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Select Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleMultipleUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Uploaded Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Uploaded ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm font-medium"
                  >
                    View Full Size
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 