/**
 * Vendor-agnostic storage interface. Impl in 4b via S3 adapter (R2 today,
 * AWS/MinIO/B2 tomorrow — same API).
 */
export interface StorageService {
  getUploadUrl(input: { key: string; contentType: string; maxBytes: number }): Promise<{
    uploadUrl: string;
    publicUrl: string;
    headers?: Record<string, string>;
  }>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}

export const storageService: StorageService = {
  async getUploadUrl() {
    throw new Error("StorageService is not yet configured. Set S3_* env vars.");
  },
  async delete() {
    throw new Error("StorageService is not yet configured. Set S3_* env vars.");
  },
  getPublicUrl() {
    throw new Error("StorageService is not yet configured. Set S3_* env vars.");
  },
};
