/*
 * File: CustomClaimTypes.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Holds the names of the custom claims carried in the JWT.
 *
 * Individual Contribution: Defined the NIC claim name used to identify the prosumer
 *                          making a reservation.
 */

namespace SmartSolarMicrogridAPI.Common.Constants;

public static class CustomClaimTypes
{
    public const string Nic = "nic";
}
