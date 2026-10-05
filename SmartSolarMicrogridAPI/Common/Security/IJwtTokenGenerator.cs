/*
 * File: IJwtTokenGenerator.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 42
 * Description: Interface defining contract for generating signed JWT tokens.
 * Individual Contribution: Implemented the JWT token generator interface.
 */

using SmartSolarMicrogridAPI.Models.Entities;

namespace SmartSolarMicrogridAPI.Common.Security;

public interface IJwtTokenGenerator
{
      (string Token, DateTime ExpiresAtUtc) GenerateToken(User user);
}
