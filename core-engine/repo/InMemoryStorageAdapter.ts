import { InMemoryRepo } from "./InMemoryRepo";
import type { StorageAdapter } from "./StorageAdapter";

export class InMemoryStorageAdapter
  extends InMemoryRepo
  implements StorageAdapter {}
