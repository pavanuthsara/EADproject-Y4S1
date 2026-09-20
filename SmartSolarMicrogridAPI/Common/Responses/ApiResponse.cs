/*
 * File: ApiResponse.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Generic response envelope returned by every API endpoint.
 *
 * Individual Contribution: Implemented the generic response envelope with Ok and Fail
 *                          factory methods.
 */

namespace SmartSolarMicrogridAPI.Common.Responses;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }

    // Builds a successful response carrying the given data.
    public static ApiResponse<T> Ok(T? data, string message = "")
    {
        return new ApiResponse<T> { Success = true, Message = message, Data = data };
    }

    // Builds a failed response carrying only an error message.
    public static ApiResponse<T> Fail(string message)
    {
        return new ApiResponse<T> { Success = false, Message = message };
    }
}
