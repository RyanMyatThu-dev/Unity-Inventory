using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Unity_Inventory.Domain.Exceptions;
using Unity_Inventory.Shared;

namespace Unity_Inventory.Shared.Middlewares
{
    public class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly IHostEnvironment _env;
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(IHostEnvironment env, ILogger<GlobalExceptionHandler> logger)
        {
            _env = env;
            _logger = logger;
        }

        public async ValueTask<bool> TryHandleAsync(
            HttpContext httpContext,
            Exception exception,
            CancellationToken cancellationToken)
        {
            var statusCode = exception switch
            {
                NotFoundException => (int)HttpStatusCode.NotFound,
                KeyNotFoundException => (int)HttpStatusCode.NotFound,
                ValidationException => (int)HttpStatusCode.BadRequest,
                ArgumentException => (int)HttpStatusCode.BadRequest,
                InvalidOperationException => (int)HttpStatusCode.BadRequest,
                _ => (int)HttpStatusCode.InternalServerError
            };

            var location = GetErrorLocation(exception);
            var requestMethod = httpContext.Request.Method;
            var requestPath = httpContext.Request.Path;
            var userName = httpContext.User?.Identity?.Name ?? "Anonymous";

            if (statusCode == (int)HttpStatusCode.InternalServerError)
            {
                _logger.LogError(exception, "Unhandled exception occurred at {ErrorLocation} - Method: {Method}, Path: {Path}, User: {User}", 
                    location, requestMethod, requestPath, userName);
            }
            else
            {
                _logger.LogWarning("Client-side exception occurred at {ErrorLocation} - Method: {Method}, Path: {Path}, User: {User}. Message: {Message}", 
                    location, requestMethod, requestPath, userName, exception.Message);
            }

            httpContext.Response.StatusCode = statusCode;
            httpContext.Response.ContentType = "application/json";

            Result responsePayload;

            if (_env.IsDevelopment())
            {
                // In Development: detailed exception and stack trace
                var detailedMessage = $"Exception: {exception.Message}\nStack Trace: {exception.StackTrace}";
                responsePayload = Result.Failure(detailedMessage);
            }
            else
            {
                // In Production: user-friendly message for 500, exact message for client-side errors
                if (statusCode == (int)HttpStatusCode.InternalServerError)
                {
                    responsePayload = Result.Failure("An unexpected error occurred. Please try again later.");
                }
                else
                {
                    responsePayload = Result.Failure(exception.Message);
                }
            }

            var json = JsonSerializer.Serialize(responsePayload, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            });

            await httpContext.Response.WriteAsync(json, cancellationToken);

            return true;
        }

        private string GetErrorLocation(Exception exception)
        {
            try
            {
                var stackTrace = new StackTrace(exception, true);
                var frames = stackTrace.GetFrames();
                if (frames != null)
                {
                    foreach (var frame in frames)
                    {
                        var method = frame.GetMethod();
                        if (method != null && method.DeclaringType != null)
                        {
                            var ns = method.DeclaringType.Namespace;
                            if (ns != null && ns.StartsWith("Unity_Inventory"))
                            {
                                var fileName = frame.GetFileName();
                                if (!string.IsNullOrEmpty(fileName))
                                {
                                    fileName = Path.GetFileName(fileName);
                                    var lineNumber = frame.GetFileLineNumber();
                                    return $"[{fileName}:{lineNumber}]";
                                }
                            }
                        }
                    }
                }
            }
            catch
            {
                // Fail silently
            }
            return "[Unknown:0]";
        }
    }
}
