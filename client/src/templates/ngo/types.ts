import type { NGOWebsiteData } from '../../types/ngo';
import type { ClientRequirements, GeneratedWebsite } from '../../types/admin';
import type { NgoArchetypeId } from './ids';

/** Licences a template may carry. Anything that needs a visible credit or a reciprocal licence is not accepted. */
export type NgoLicense = 'MIT' | 'Apache-2.0' | 'BSD-3-Clause' | 'ISC' | 'CC0-1.0';

/** Where an integrated template came from. Filled from the upstream LICENSE file and repository, never from a listing. */
export interface NgoTemplateSource {
  kind: 'adapted';
  /** Upstream template name. */
  name: string;
  author: string;
  repoUrl: string;
  /** Upstream commit the bundle was taken from. */
  commit: string;
  license: NgoLicense;
  /** Copyright line from the upstream LICENSE file. */
  copyright: string;
  /** ISO date the upstream copy was retrieved. */
  retrievedAt: string;
  /** What the upstream says about its photographs, and what DigiVerse does with them. */
  imageNote: string;
  /** What changed from upstream. Design, layout, type and motion are kept. */
  changes: string[];
  /** Words only the upstream sample content contains. A live site must never show any of them (unit/browser tested). */
  sampleTokens: string[];
}

export interface NgoTemplateDefinition {
  id: string;
  archetype: NgoArchetypeId;
  name: string;
  tagline: string;
  description: string;
  /** Short design-direction line shown on cards. */
  designStyle: string;
  highlights: string[];
  /** Entry page file inside `/ngo-templates/<id>/`. */
  entry: string;
  previewImage: string;
  source: NgoTemplateSource;
}

export interface NgoTemplateProps {
  requirements?: Partial<ClientRequirements> | null;
  ngoData?: NGOWebsiteData | null;
  website?: Partial<GeneratedWebsite> | null;
  isDemo?: boolean;
}

// ----- mapping file (client content -> the template's own markup) -----

/** A value expression: `a.b|c.d|"literal"` picks the first non-empty alternative; `{a} · {b}` interpolates. */
export type NgoExpr = string;

interface RuleBase {
  /** CSS selector inside the template page. */
  sel: string;
  /** Apply to every match (default: first match only). */
  all?: boolean;
}

export type NgoRule =
  | (RuleBase & { text: NgoExpr; /** Set only the element's own text and keep its child elements (icon + label). */ textNode?: boolean | 'first'; /** Keep one space after the text, for a lead-in that sits directly before a styled span. */ trailingSpace?: boolean; /** Start the text with one space, for text that follows an inline label. */ leadingSpace?: boolean; /** Remove this element (or the closest ancestor matching this selector) when the value is empty. */ emptyRemove?: string | true })
  | (RuleBase & { literal: string })
  | (RuleBase & { attr: string; value: NgoExpr; emptyRemove?: string | true })
  | (RuleBase & { image: NgoExpr; /** Ancestor selector to remove when there is no image (default: the image itself). */ emptyRemove?: string })
  | (RuleBase & { remove: true; /** Only remove when this value expression is empty. */ ifEmpty?: NgoExpr })
  /** Sets a CSS custom property to the length of a text value (templates that size a display line by its character count). */
  | (RuleBase & { lenVar: string; of: NgoExpr })
  /** Inserts the organisation logo before the element's content (only when the client supplied a logo). */
  | (RuleBase & { logo: NgoExpr; height?: number })
  | (RuleBase & {
      /** Data path of an array. Each element of `sel` is one slot; slots are filled in order and spare slots are removed. */
      repeat: string;
      /** Fields: `"selector"` sets text, `"selector@attr"` sets an attribute, `"selector@image"` sets an image. */
      fields: Record<string, NgoExpr>;
      /** Fewer items than this removes every slot and the `section` ancestor. */
      min?: number;
      max?: number;
      /** Start at this element of the list (a template may use the first story for a hero quote and the next ones for small cards). */
      offset?: number;
      /** Clone the last slot to fit more items than the template shows. */
      grow?: boolean;
      /** Ancestor selector removed when the list is empty or below `min`. */
      section?: string;
      /** Rules applied inside each filled slot, reading that slot's item (a day's time slots, a ticket's feature list). */
      nested?: NgoRule[];
      /**
       * Selector (resolved on the untouched page) of the element to build every slot from. All existing slots are replaced by fresh copies
       * of it, so each item gets the full structure even when the template's own sample slots differ in shape (a break row, a keynote row).
       */
      proto?: string;
    });

export interface NgoMappingFile {
  version: 1;
  /** Pages of the bundle this mapping covers (default: the entry page only). */
  pages?: string[];
  /** CSS custom properties the Studio brand colours may override. */
  brandVars?: Record<string, 'primary' | 'accent'>;
  /** Selectors kept even though no rule sets their text (template-owned UI labels). */
  keep?: string[];
  /** Decorative artwork the template ships under its own licence (illustrations, icons) that stays on a live site. Not client photographs. */
  keepImages?: string[];
  /** Containers (for example footer columns) removed once they hold no link, after in-page links to removed sections are dropped. */
  pruneIfNoLinks?: string[];
  /** Photo frames and similar wrappers removed when they hold no image and no text (an image the client did not supply). */
  pruneEmpty?: string[];
  rules: NgoRule[];
}
