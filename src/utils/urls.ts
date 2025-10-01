/**
 * Utility functions for building hierarchical technique URLs
 */

/**
 * Builds a technique URL with optional trainer and entry parameters
 * 
 * @param slug - The technique slug
 * @param trainerId - Optional trainer ID for trainer-specific version
 * @param entry - Optional entry mode (irimi/tenkan)
 * @returns Hierarchical technique URL
 * 
 * Examples:
 * - buildTechniqueUrl('katate-dori-kaiten-nage-soto') → '/technique/katate-dori-kaiten-nage-soto'
 * - buildTechniqueUrl('katate-dori-kaiten-nage-soto', 'alfred-haase') → '/technique/katate-dori-kaiten-nage-soto/alfred-haase'
 * - buildTechniqueUrl('katate-dori-kaiten-nage-soto', 'alfred-haase', 'irimi') → '/technique/katate-dori-kaiten-nage-soto/alfred-haase/irimi'
 */
export const buildTechniqueUrl = (slug: string, trainerId?: string, entry?: 'irimi' | 'tenkan'): string => {
  const encodedSlug = encodeURIComponent(slug);
  let path = `/technique/${encodedSlug}`;
  
  if (trainerId) {
    const encodedTrainerId = encodeURIComponent(trainerId);
    path += `/${encodedTrainerId}`;
    
    if (entry) {
      path += `/${entry}`;
    }
  }
  
  return path;
};

/**
 * Parses technique parameters from a pathname
 * 
 * @param pathname - The pathname to parse (e.g., '/technique/slug/trainer/entry')
 * @returns Parsed technique parameters or null if not a technique path
 */
export const parseTechniquePath = (pathname: string): { slug: string; trainerId?: string; entry?: 'irimi' | 'tenkan' } | null => {
  // Match patterns:
  // /technique/{slug}
  // /technique/{slug}/{trainerId}
  // /technique/{slug}/{trainerId}/{entry}
  const match = /^\/technique\/([^/?#]+)(?:\/([^/?#]+))?(?:\/([^/?#]+))?/.exec(pathname);
  
  if (!match) return null;
  
  const slug = decodeURIComponent(match[1]);
  const trainerId = match[2] ? decodeURIComponent(match[2]) : undefined;
  const entry = match[3] ? decodeURIComponent(match[3]) as 'irimi' | 'tenkan' : undefined;
  
  // Validate entry if provided
  if (entry && entry !== 'irimi' && entry !== 'tenkan') {
    return null;
  }
  
  return { slug, trainerId, entry };
};