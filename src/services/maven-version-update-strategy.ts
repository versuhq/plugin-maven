import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import type { ModuleRegistry, VersionUpdateStrategy } from "@versu/core";
import { MAVEN_POM_FILE } from "../constants.js";
import { DOMParser, XMLSerializer, type Element } from "@xmldom/xmldom";

const MAVEN_NS = "http://maven.apache.org/POM/4.0.0";

type ParentInfo = { groupId?: string; artifactId?: string; version?: string };

type PomUpdate = {
  projectVersion?: string;
  parentVersion?: string;
};

export class MavenVersionUpdateStrategy implements VersionUpdateStrategy {
  constructor(
    private readonly repoRoot: string,
    private readonly moduleRegistry: ModuleRegistry,
  ) {}

  async writeVersionUpdates(
    moduleVersions: Map<string, string>,
  ): Promise<void> {
    const updatedCoords = new Map<string, string>();

    for (const [moduleId, newVersion] of moduleVersions) {
      const module = this.moduleRegistry.getModule(moduleId);
      const groupId = module["groupId"] as string | undefined;
      const artifactId = module["artifactId"] as string | undefined;
      if (groupId && artifactId) {
        updatedCoords.set(`${groupId}:${artifactId}`, newVersion);
      }
    }

    for (const module of this.moduleRegistry.getModules().values()) {
      const pomPath =
        (module["pomPath"] as string | undefined) ||
        join(this.repoRoot, module.path, MAVEN_POM_FILE);

      const moduleNewVersion = moduleVersions.get(module.id);
      const parent = module["parent"] as ParentInfo | undefined;

      const updates: PomUpdate = {};

      if (moduleNewVersion && module.declaredVersion) {
        updates.projectVersion = moduleNewVersion;
      }

      const parentCoord =
        parent?.groupId && parent?.artifactId
          ? `${parent.groupId}:${parent.artifactId}`
          : undefined;

      if (parentCoord && updatedCoords.has(parentCoord)) {
        updates.parentVersion = updatedCoords.get(parentCoord);
      }

      if (updates.projectVersion || updates.parentVersion) {
        await this.updatePom(pomPath, updates);
      }
    }
  }

  private async updatePom(pomPath: string, updates: PomUpdate): Promise<void> {
    const xml = await readFile(pomPath, "utf8");
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const project = doc.documentElement;
    if (!project) return;

    // This specifically targets the project version, NOT dependency versions
    if (updates.projectVersion) {
      const versionEl = this.getDirectChildNS(project, "version");
      if (versionEl) {
        versionEl.textContent = updates.projectVersion;
      }
    }

    if (updates.parentVersion) {
      const parentEl = this.getDirectChildNS(project, "parent");
      const versionEl = parentEl
        ? this.getDirectChildNS(parentEl, "version")
        : null;
      if (versionEl) {
        versionEl.textContent = updates.parentVersion;
      }
    }

    // Serialize back to string
    const updatedXml = new XMLSerializer().serializeToString(doc);
    await writeFile(pomPath, updatedXml, "utf8");
  }

  private getDirectChildNS(
    parent: Element,
    localName: string,
  ): Element | null {
    const children = parent.getElementsByTagNameNS(MAVEN_NS, localName);
    for (let i = 0; i < children.length; i++) {
      if (children[i]!.parentNode === parent) {
        return children[i]!;
      }
    }
    return null;
  }
}
