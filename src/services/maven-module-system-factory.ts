import type {
  ModuleDetector,
  ModuleRegistry,
  ModuleSystemFactory,
  VersionUpdateStrategy,
} from "@versu/core";
import { MavenModuleDetector } from "./maven-module-detector.js";
import { MavenVersionUpdateStrategy } from "./maven-version-update-strategy.js";

/**
 * Factory for creating Maven-specific module system components.
 */
export class MavenModuleSystemFactory implements ModuleSystemFactory {
  /** Absolute path to the repository root directory. */
  constructor(private readonly repoRoot: string) {}

  async createDetector(_outputFile: string): Promise<ModuleDetector> {
    return new MavenModuleDetector(this.repoRoot);
  }

  async createVersionUpdateStrategy(
    moduleRegistry: ModuleRegistry,
  ): Promise<VersionUpdateStrategy> {
    return new MavenVersionUpdateStrategy(this.repoRoot, moduleRegistry);
  }
}
