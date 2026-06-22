import type { PluginContract } from "@versu/core";
import { MavenAdapterIdentifier } from "./services/maven-adapter-identifier.js";
import { MavenModuleSystemFactory } from "./services/maven-module-system-factory.js";
import { AUTHORS, VERSION } from "./utils/version.js";

const mavenPlugin: PluginContract = {
  id: "maven",
  name: "Maven",
  description:
    "Adapter plugin for Maven build system. Provides support for detecting and updating versions in Maven projects.",
  version: VERSION,
  authors: AUTHORS,
  adapters: [
    {
      id: "maven",
      adapterIdentifier: async (_configDirectory: string) => new MavenAdapterIdentifier(),
      moduleSystemFactory: async (repoRoot: string, _configDirectory: string) =>
        new MavenModuleSystemFactory(repoRoot),
    },
  ],
};

export default mavenPlugin;
