/*
 * File: IEntity.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Marks a MongoDB entity that exposes its document id so repositories can
 *              manage it.
 *
 * Individual Contribution: Implemented the entity id contract used by the generic
 *                          repository.
 */

namespace SmartSolarMicrogridAPI.Models.Entities;

public interface IEntity
{
    string Id { get; set; }
}
