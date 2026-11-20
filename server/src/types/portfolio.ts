export type PortfolioArchetype =
  | 'developer'
  | 'fullstack_dev'
  | 'data_scientist'
  | 'designer'
  | 'graphic_artist'
  | 'photographer'
  | 'filmmaker'
  | 'motion_3d'
  | 'freelancer'
  | 'marketer_seo'
  | 'content_creator'
  | 'architect'
  | 'academic_pro'
  | 'student_grad'
  | 'writer_author'
  | 'fine_artist'
  | 'product_designer'
  | 'personal_brand';

export type PortfolioProfessionCategory =
  | 'developer'
  | 'fullstack_dev'
  | 'data_scientist'
  | 'designer'
  | 'graphic_artist'
  | 'photographer'
  | 'filmmaker'
  | 'motion_3d'
  | 'freelancer'
  | 'marketer_seo'
  | 'content_creator'
  | 'architect'
  | 'academic_pro'
  | 'student_grad'
  | 'writer_author'
  | 'fine_artist'
  | 'product_designer'
  | 'personal_brand'
  // Backward compatibility aliases
  | 'creative_artist'
  | 'professional'
  | 'academic';

export interface PortfolioIdentity {
  fullName: string;
  displayName?: string;
  title?: string;
  professionalTitle?: string;
  tagline?: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  profilePhotoUrl?: string;
  coverImageUrl?: string;
  heroCoverUrl?: string;
  location?: string;
  email?: string;
  phone?: string;
  currentCompany?: string;
  currentRole?: string;
  availableForHire?: boolean;
  availabilityStatus?: string;
  yearsOfExperience?: number;
  socialLinks?: Record<string, string>;
}

export interface PortfolioSkillItem {
  id: string;
  name: string;
  category?: string;
  level?: string;
  proficiency?: string;
  yearsUsing?: number;
  yearsOfExperience?: number;
  featured?: boolean;
}

export interface PortfolioProjectItem {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  category?: string;
  description?: string;
  detailedDescription?: string;
  imageUrl?: string;
  featuredImageUrl?: string;
  galleryImages?: string[];
  liveUrl?: string;
  sourceUrl?: string;
  githubUrl?: string;
  caseStudyUrl?: string;
  tags?: string[];
  technologies?: string[];
  role?: string;
  year?: string;
  /** Profession-specific extras collected by the intake (all optional). */
  client?: string;
  problem?: string;
  process?: string;
  outcome?: string;
  location?: string;
  area?: string;
  tools?: string[];
  order?: number;
  metrics?: { label: string; value: string }[];
  featured?: boolean;
}

export interface PortfolioExperienceItem {
  id: string;
  title?: string;
  role?: string;
  company?: string;
  organization?: string;
  organizationUrl?: string;
  location?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  isCurrentRole?: boolean;
  description: string;
  highlights?: string[];
  technologies?: string[];
  technologiesUsed?: string[];
}

export interface PortfolioEducationItem {
  id: string;
  degree: string;
  institution: string;
  location?: string;
  year?: string;
  yearGraduated?: string;
  honors?: string;
}

export interface PortfolioPublicationItem {
  id: string;
  title: string;
  publisher?: string;
  publisherOrJournal?: string;
  publicationDate?: string;
  year?: string;
  doi?: string;
  url?: string;
  link?: string;
  authors?: string[];
  abstract?: string;
  bibtex?: string;
  type?: string;
}

export interface PortfolioServiceItem {
  id: string;
  title: string;
  description: string;
  deliverables?: string[];
  price?: string;
  startingPrice?: string;
  timeline?: string;
  featured?: boolean;
}

export interface PortfolioTestimonialItem {
  id: string;
  quote: string;
  authorName?: string;
  authorTitle?: string;
  clientName?: string;
  clientRole?: string;
  clientCompany?: string;
  organization?: string;
  avatarUrl?: string;
  rating?: number;
}

export interface PortfolioAchievementItem {
  id: string;
  title: string;
  issuer?: string;
  year?: string;
  description?: string;
  url?: string;
}

export interface PortfolioCertificationItem {
  id: string;
  name: string;
  issuer?: string;
  year?: string;
  credentialUrl?: string;
}

export interface PortfolioMediaConfig {
  officialLogoUrl?: string;
  officialHeroBannerUrl?: string;
  additionalBrandingImages?: string[];
  googleDriveGalleryUrl?: string;
  googleDriveVideoUrl?: string;
  googleDriveVideoUrls?: string[];
  youtubeUrl?: string;
  youtubeUrls?: string[];
  youtubePlaylistUrls?: string[];
}

export interface PortfolioWebsiteData {
  schemaVersion: '1.0';
  archetype: PortfolioArchetype;
  professionCategory?: PortfolioProfessionCategory;
  identity: PortfolioIdentity;
  about?: {
    bio: string;
    story?: string;
    interests?: string[];
    brandStatement?: string;
  };
  skills: PortfolioSkillItem[];
  projects: PortfolioProjectItem[];
  experience: PortfolioExperienceItem[];
  education?: PortfolioEducationItem[];
  publications?: PortfolioPublicationItem[];
  services?: PortfolioServiceItem[];
  testimonials?: PortfolioTestimonialItem[];
  achievements?: PortfolioAchievementItem[];
  certifications?: PortfolioCertificationItem[];
  /** Link to the person's CV / résumé (PDF or hosted page). */
  resumeUrl?: string;
  socialLinks?: Record<string, string>;
  branding?: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    headingFont: string;
    stylePreset: string;
  };
  media?: PortfolioMediaConfig;
  navigationConfig?: {
    enabledPages?: string[];
    ctaButtonText?: string;
  };
}
