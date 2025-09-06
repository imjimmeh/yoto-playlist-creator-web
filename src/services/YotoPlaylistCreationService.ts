import { HybridIconMapper } from "./HybridIconMapper";
import { YotoHttpClient } from "./YotoHttpClient";
import type { AiConfig } from "./HybridIconMapper";

export class YotoPlaylistCreationService {
  readonly iconMapper: HybridIconMapper;

  constructor(yotoClient: YotoHttpClient, aiConfig?: AiConfig) {
    this.iconMapper = new HybridIconMapper(yotoClient, aiConfig);
  }

}