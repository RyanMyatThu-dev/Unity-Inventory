using CloudinaryDotNet.Actions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IMS.Domain.Features.PhotoUpload
{
    public interface IPhotoUploadService
    {
        Task<ImageUploadResult> UploadPhotoAsync(Stream photoStream, string fileName);

        Task<DeletionResult> DeletePhotoAsync(string publicId);
    }
}
