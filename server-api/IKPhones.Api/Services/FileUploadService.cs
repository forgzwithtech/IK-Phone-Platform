using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Threading.Tasks;

namespace IKPhones.API.Services
{
    public class FileUploadService
    {
        private readonly Supabase.Client _supabase;
        private const string BucketName = "device-images";

        public FileUploadService(Supabase.Client supabase)
        {
            _supabase = supabase;
        }

        public async Task<string> UploadDeviceImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return string.Empty;

            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"devices/{Guid.NewGuid()}{fileExtension}";

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            var fileBytes = memoryStream.ToArray();

            await _supabase.Storage
                .From(BucketName)
                .Upload(fileBytes, uniqueFileName, new Supabase.Storage.FileOptions
                {
                    ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "image/jpeg" : file.ContentType,
                    Upsert = false
                });

            // Return the permanent public HTTPS URL
            return _supabase.Storage
                .From(BucketName)
                .GetPublicUrl(uniqueFileName);
        }
    }
}