/*
 * File: IEntity.cs
 * Purpose: Marks a MongoDB entity that exposes its document id so repositories can manage it.
 */

namespace SmartSolarMicrogridAPI.Models.Entities;

public interface IEntity
{
    string Id { get; set; }
}
