/*
 * File: ExceptionHandlingMiddleware.cs
 * Purpose: Converts unhandled exceptions into ApiResponse JSON with the matching HTTP status code.
 */

using SmartSolarMicrogridAPI.Common.Constants;
using SmartSolarMicrogridAPI.Common.Exceptions;
using SmartSolarMicrogridAPI.Common.Responses;

namespace SmartSolarMicrogridAPI.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    // Stores the next delegate in the pipeline and the logger.
    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    // Runs the rest of the pipeline and translates any thrown exception into an error response.
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex) when (!context.Response.HasStarted)
        {
            await WriteErrorResponseAsync(context, ex);
        }
    }

    // Maps the exception type to a status code and writes a safe ApiResponse body.
    private async Task WriteErrorResponseAsync(HttpContext context, Exception ex)
    {
        var (statusCode, message) = ex switch
        {
            NotFoundException => (StatusCodes.Status404NotFound, ex.Message),
            BusinessRuleException => (StatusCodes.Status400BadRequest, ex.Message),
            ForbiddenException => (StatusCodes.Status403Forbidden, ex.Message),
            _ => (StatusCodes.Status500InternalServerError, ErrorMessages.InternalServerError)
        };

        if (statusCode == StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(ex, "Unhandled exception while processing {Method} {Path}", context.Request.Method, context.Request.Path);
        }

        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail(message));
    }
}
