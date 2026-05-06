using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IMS.Domain.Features.PhotoUpload
{
    public class PhotoUploadService : IPhotoUploadService
    {
        private readonly Cloudinary _cloudinary;
        public PhotoUploadService(Cloudinary cloudinary)
        {
            _cloudinary = cloudinary;
        }

        public async Task<DeletionResult> DeletePhotoAsync(string publicId)
        {
            var deletionParams = new DeletionParams(publicId);
            var result = await _cloudinary.DestroyAsync(deletionParams);
            return result;
        }

        public async Task<ImageUploadResult> UploadPhotoAsync(Stream photoStream, string fileName)
        {
            try
            {
                if (photoStream == null)
                {
                    return new ImageUploadResult
                    {
                        Error = new Error { Message = "Photo stream is required." }
                    };
                }

                if (string.IsNullOrWhiteSpace(fileName))
                {
                    return new ImageUploadResult
                    {
                        Error = new Error { Message = "File name is required for photo upload." }
                    };
                }
                long maxFileSize = 5 * 1024 * 1024;
                if (photoStream.Length > maxFileSize)
                {
                    return new ImageUploadResult
                    {
                        Error = new Error { Message = "File size exceeds the 5MB limit. Upload rejected." }
                    };
                }
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(fileName, photoStream),
                    Folder = "IMS_Pro_Photos"
                };
                return await _cloudinary.UploadAsync(uploadParams);

            }
            catch (Exception ex)
            {
                return new ImageUploadResult
                {
                    Error = new Error { Message = $"An error occurred while uploading the photo: {ex.Message}" }
                };

            }

        }
    }
}
