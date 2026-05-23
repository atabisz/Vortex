import type { Chunk, Resolver, ResolvedEndpoint, ResolvedResource } from "@vortex/shared/download";

<<<<<<< HEAD
export const urlResolver: Resolver<URL> = (url) => Promise.resolve({ url });
=======
export type Resolver<T> = (resource: T) => Promise<ResolvedResource>;

export type ResolvedResource = URL | { probeUrl: URL; chunkUrl?: (chunk: Chunk) => Promise<URL> };

export const urlResolver: Resolver<URL> = (url) => Promise.resolve(url);
>>>>>>> v2.0.2

/** @internal */
export type NormalizedResource = {
  probeEndpoint: ResolvedEndpoint;
  chunkEndpoint: (chunk: Chunk) => Promise<ResolvedEndpoint>;
};

/** @internal */
export function normalize(resource: ResolvedResource): NormalizedResource {
  if ("url" in resource) {
    return {
      probeEndpoint: resource,
      chunkEndpoint: () => Promise.resolve(resource),
    };
  }

  const { probeEndpoint, chunkEndpoint } = resource;
  return {
    probeEndpoint,
    chunkEndpoint: chunkEndpoint ?? (() => Promise.resolve(probeEndpoint)),
  };
}
