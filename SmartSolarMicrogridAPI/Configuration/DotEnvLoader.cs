/*
 * File: DotEnvLoader.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Loads the optional .env file into the process environment before the
 *              configuration system is built.
 *
 * Individual Contribution: Implemented the .env loading that keeps real environment
 *                          variables higher priority than the file.
 */

using DotNetEnv;

namespace SmartSolarMicrogridAPI.Configuration;

public static class DotEnvLoader
{
    private const string EnvFileName = ".env";

    // Loads .env from the working directory if it exists, without overwriting variables that are already set.
    public static void Load()
    {
        var path = Path.Combine(Directory.GetCurrentDirectory(), EnvFileName);

        if (File.Exists(path))
        {
            Env.NoClobber().Load(path);
        }
    }
}
