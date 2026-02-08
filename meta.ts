export interface VendorSkillMeta {
  official?: boolean
  source: string
  skills: Record<string, string> // sourceSkillName -> outputSkillName
}

/**
 * Repositories cloned as git submodules into sources/.
 * Used for AI-generated skills from upstream documentation.
 */
export const submodules: Record<string, string> = {
  // Go ecosystem
  // go: 'https://github.com/golang/go',

  // Infrastructure
  // docker: 'https://github.com/docker/docs',
  // kubernetes: 'https://github.com/kubernetes/website',

  // Databases
  // postgres: 'https://github.com/postgres/postgres',
  // redis: 'https://github.com/redis/redis-doc',
}

/**
 * Projects that maintain their own skills directories.
 * Synced as git submodules into vendor/.
 */
export const vendors: Record<string, VendorSkillMeta> = {
  // Example:
  // 'some-project': {
  //   official: true,
  //   source: 'https://github.com/org/repo',
  //   skills: { 'skill-name': 'skill-name' },
  // },
}

/**
 * Hand-written skills maintained in skills/.
 */
export const manual = ['stuckinforloop']
