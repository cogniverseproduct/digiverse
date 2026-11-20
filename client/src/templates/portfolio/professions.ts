import type { PortfolioArchetype } from '../../types/portfolio';
import type { PortfolioTemplateId } from './types';
import { DEFAULT_TEMPLATE_BY_ARCHETYPE } from './registry';

/**
 * Profession-specific behaviour of the portfolio intake wizard. The wizard always has the same 10 steps, but
 * labels, suggestions, project fields, link slots and optional sections adapt to the chosen profession.
 */

export type ProjectFieldKey =
  | 'summary' | 'category' | 'year' | 'role' | 'client' | 'problem' | 'process' | 'outcome'
  | 'location' | 'area' | 'tools' | 'liveUrl' | 'githubUrl' | 'caseStudyUrl' | 'image' | 'gallery' | 'videoUrl';

export type ExtraSection = 'publications' | 'services' | 'testimonials';

export interface SocialSlot { key: string; label: string; placeholder: string }

export interface ProfessionConfig {
  id: PortfolioArchetype;
  /** Card title in New Portfolio. */
  label: string;
  /** One line under the title. */
  subtitle: string;
  /** Template the engine suggests for this profession (always an active template). */
  recommendedTemplate: PortfolioTemplateId;
  /** What the intake asks for, shown on the card. */
  intakeHighlights: string[];
  copy: {
    titlePlaceholder: string;
    headlinePlaceholder: string;
    bioHint: string;
    skillsHeading: string;
    skillPlaceholder: string;
    projectsHeading: string;
    projectNoun: string;
    projectsHint: string;
  };
  skillCategories: string[];
  skillSuggestions: string[];
  projectCategories: string[];
  /** Fields shown in the project form after the title. Title is always required. */
  projectFields: ProjectFieldKey[];
  /** At least one of these must be present to finish step 6. */
  requiredWork: 'projects' | 'projects_or_services' | 'projects_or_education';
  socialLinks: SocialSlot[];
  extras: ExtraSection[];
  /** Education step wording. */
  educationHint: string;
}

const link = (key: string, label: string, placeholder: string): SocialSlot => ({ key, label, placeholder });
const LINKEDIN = link('linkedin', 'LinkedIn', 'https://www.linkedin.com/in/…');
const WEBSITE = link('website', 'Personal website', 'https://…');
const INSTAGRAM = link('instagram', 'Instagram', 'https://instagram.com/…');
const YOUTUBE = link('youtube', 'YouTube', 'https://youtube.com/@…');
const GITHUB = link('github', 'GitHub', 'https://github.com/…');
const BEHANCE = link('behance', 'Behance', 'https://behance.net/…');
const DRIBBBLE = link('dribbble', 'Dribbble', 'https://dribbble.com/…');

export const PROFESSIONS: Record<Exclude<PortfolioArchetype, 'academic_pro' | 'personal_brand'>, ProfessionConfig> = {
  developer: {
    id: 'developer', label: 'Software Engineer', subtitle: 'Full-stack, backend, mobile and systems engineers',
    recommendedTemplate: 'engineer-blueprint',
    intakeHighlights: ['Tech-stack skills by category', 'GitHub and live-demo links per project', 'Architecture notes and role', 'Career timeline'],
    copy: { titlePlaceholder: 'e.g. Senior Full-Stack Engineer', headlinePlaceholder: 'One sentence on what you build and for whom', bioHint: 'Describe the systems you build, your engineering approach and the scale you work at.', skillsHeading: 'Tech stack and tools', skillPlaceholder: 'e.g. TypeScript, Go, PostgreSQL, Kubernetes', projectsHeading: 'Projects and repositories', projectNoun: 'project', projectsHint: 'Add the systems you are proudest of, with a repository and a live link where possible.' },
    skillCategories: ['Languages', 'Frameworks', 'Databases', 'Cloud & DevOps', 'Tools'],
    skillSuggestions: ['TypeScript', 'React', 'Node.js', 'Python', 'Go', 'PostgreSQL', 'Docker', 'AWS'],
    projectCategories: ['Web app', 'Backend / API', 'Mobile', 'Open source', 'Infrastructure', 'Tooling'],
    projectFields: ['summary', 'category', 'year', 'role', 'tools', 'githubUrl', 'liveUrl', 'caseStudyUrl', 'image'],
    requiredWork: 'projects', socialLinks: [GITHUB, LINKEDIN, link('x', 'X / Twitter', 'https://x.com/…'), WEBSITE, link('devto', 'Dev.to / blog', 'https://dev.to/…')],
    extras: [], educationHint: 'Degrees, bootcamps or relevant coursework.'
  },
  designer: {
    id: 'designer', label: 'UI/UX & Product Designer', subtitle: 'Product, interaction and UX designers',
    recommendedTemplate: 'editorial-ux',
    intakeHighlights: ['Case studies with problem, process and outcome', 'Design tools and methods', 'Dribbble, Behance and Figma links', 'Client testimonials'],
    copy: { titlePlaceholder: 'e.g. Senior Product Designer', headlinePlaceholder: 'One sentence on the problems you design for', bioHint: 'Describe your design approach, the products you have shaped and the results they achieved.', skillsHeading: 'Design skills and tools', skillPlaceholder: 'e.g. Figma, Design systems, User research, Prototyping', projectsHeading: 'Case studies', projectNoun: 'case study', projectsHint: 'Each case study should say what the problem was, what you did and what changed.' },
    skillCategories: ['Design', 'Research', 'Prototyping', 'Tools', 'Collaboration'],
    skillSuggestions: ['Figma', 'Design systems', 'User research', 'Prototyping', 'Interaction design', 'Accessibility'],
    projectCategories: ['Mobile app', 'Web product', 'Design system', 'Research', 'Branding', 'Service design'],
    projectFields: ['summary', 'category', 'year', 'role', 'client', 'problem', 'process', 'outcome', 'tools', 'caseStudyUrl', 'liveUrl', 'image', 'gallery'],
    requiredWork: 'projects', socialLinks: [DRIBBBLE, BEHANCE, link('figma', 'Figma community', 'https://figma.com/@…'), LINKEDIN, WEBSITE, INSTAGRAM],
    extras: ['testimonials'], educationHint: 'Degrees, certificates and design courses.'
  },
  photographer: {
    id: 'photographer', label: 'Photographer', subtitle: 'Landscape, portrait, wedding, documentary and commercial',
    recommendedTemplate: 'photo-fullscreen',
    intakeHighlights: ['Galleries by photography category', 'Image uploads for every series', 'Camera and gear notes', 'Prints and bookings'],
    copy: { titlePlaceholder: 'e.g. Landscape & Documentary Photographer', headlinePlaceholder: 'One sentence about the light, places or people you photograph', bioHint: 'Describe your photographic style, subjects and how you work with clients.', skillsHeading: 'Genres, gear and techniques', skillPlaceholder: 'e.g. Long exposure, Medium format, Lightroom, Drone', projectsHeading: 'Galleries and series', projectNoun: 'gallery', projectsHint: 'Add each series with a cover image and as many photographs as you like.' },
    skillCategories: ['Genre', 'Camera & lenses', 'Lighting', 'Editing', 'Other'],
    skillSuggestions: ['Landscape', 'Portrait', 'Street', 'Wedding', 'Lightroom', 'Photoshop', 'Drone'],
    projectCategories: ['Landscape', 'Portrait', 'Street', 'Wedding', 'Wildlife', 'Architecture', 'Travel', 'Documentary', 'Fine art', 'Product'],
    projectFields: ['summary', 'category', 'year', 'location', 'tools', 'image', 'gallery'],
    requiredWork: 'projects', socialLinks: [INSTAGRAM, link('500px', '500px', 'https://500px.com/…'), BEHANCE, YOUTUBE, WEBSITE, LINKEDIN],
    extras: ['services', 'testimonials'], educationHint: 'Photography courses, degrees, workshops and mentors.'
  },
  graphic_artist: {
    id: 'graphic_artist', label: 'Graphic Designer / Artist', subtitle: 'Brand, illustration, poster and print designers',
    recommendedTemplate: 'graphic-bold',
    intakeHighlights: ['Visual work by discipline', 'Brand and client projects', 'Behance and Dribbble links', 'Tools and styles'],
    copy: { titlePlaceholder: 'e.g. Graphic Designer & Illustrator', headlinePlaceholder: 'One sentence about your visual style', bioHint: 'Describe your style, the kinds of brands you work with and your creative process.', skillsHeading: 'Disciplines and tools', skillPlaceholder: 'e.g. Illustration, Branding, Typography, Procreate', projectsHeading: 'Visual work', projectNoun: 'project', projectsHint: 'Add brand identities, illustrations, posters and print work with a strong cover image.' },
    skillCategories: ['Discipline', 'Software', 'Style', 'Print & production'],
    skillSuggestions: ['Illustration', 'Branding', 'Typography', 'Packaging', 'Photoshop', 'Illustrator', 'Procreate'],
    projectCategories: ['Branding', 'Illustration', 'Poster', 'Packaging', 'Editorial', 'Social', 'Print'],
    projectFields: ['summary', 'category', 'year', 'client', 'role', 'tools', 'image', 'gallery', 'caseStudyUrl'],
    requiredWork: 'projects', socialLinks: [BEHANCE, DRIBBBLE, INSTAGRAM, link('pinterest', 'Pinterest', 'https://pinterest.com/…'), WEBSITE, LINKEDIN],
    extras: ['services', 'testimonials'], educationHint: 'Design school, courses and workshops.'
  },
  motion_3d: {
    id: 'motion_3d', label: '3D Artist / Motion Designer', subtitle: 'Animators, VFX, 3D generalists and motion directors',
    recommendedTemplate: 'motion-immersive',
    intakeHighlights: ['Showreel and video links', 'Software and render engines', 'Project breakdowns', 'ArtStation and Vimeo links'],
    copy: { titlePlaceholder: 'e.g. 3D Generalist & Motion Designer', headlinePlaceholder: 'One sentence about the worlds or motion you create', bioHint: 'Describe your pipeline, the software you use and the studios or brands you have worked with.', skillsHeading: 'Software and techniques', skillPlaceholder: 'e.g. Blender, Cinema 4D, After Effects, Houdini', projectsHeading: 'Reels and projects', projectNoun: 'project', projectsHint: 'Add each piece with a still image and, if you have one, a video link.' },
    skillCategories: ['3D software', 'Motion', 'Rendering', 'Simulation', 'Other'],
    skillSuggestions: ['Blender', 'Cinema 4D', 'After Effects', 'Houdini', 'Unreal Engine', 'Substance Painter'],
    projectCategories: ['Motion graphics', 'Product render', 'Character', 'VFX', 'Title sequence', 'Environment'],
    projectFields: ['summary', 'category', 'year', 'client', 'role', 'tools', 'videoUrl', 'image', 'gallery'],
    requiredWork: 'projects', socialLinks: [link('artstation', 'ArtStation', 'https://artstation.com/…'), link('vimeo', 'Vimeo', 'https://vimeo.com/…'), YOUTUBE, INSTAGRAM, BEHANCE, WEBSITE],
    extras: ['services', 'testimonials'], educationHint: 'Schools, courses and certifications.'
  },
  freelancer: {
    id: 'freelancer', label: 'Freelancer / Digital Creator', subtitle: 'Independent designers, developers, writers and consultants',
    recommendedTemplate: 'freelancer-services',
    intakeHighlights: ['Services with price and deliverables', 'Case studies with results', 'Client testimonials', 'Availability and enquiry'],
    copy: { titlePlaceholder: 'e.g. Freelance Web Designer & Developer', headlinePlaceholder: 'One sentence on who you help and how', bioHint: 'Describe who you work with, how you work and what clients get.', skillsHeading: 'Skills and tools', skillPlaceholder: 'e.g. Webflow, Branding, SEO, Copywriting', projectsHeading: 'Client work', projectNoun: 'project', projectsHint: 'Show real results: what the client needed and what changed.' },
    skillCategories: ['Core services', 'Tools', 'Industries', 'Soft skills'],
    skillSuggestions: ['Web design', 'Branding', 'SEO', 'Copywriting', 'Webflow', 'Shopify'],
    projectCategories: ['Website', 'Brand', 'App', 'Marketing', 'Consulting', 'Content'],
    projectFields: ['summary', 'category', 'year', 'client', 'role', 'outcome', 'tools', 'liveUrl', 'caseStudyUrl', 'image'],
    requiredWork: 'projects_or_services', socialLinks: [LINKEDIN, link('upwork', 'Upwork', 'https://upwork.com/freelancers/…'), link('fiverr', 'Fiverr', 'https://fiverr.com/…'), WEBSITE, INSTAGRAM, link('x', 'X / Twitter', 'https://x.com/…')],
    extras: ['services', 'testimonials'], educationHint: 'Relevant degrees and certifications.'
  },
  student_grad: {
    id: 'student_grad', label: 'Student / Fresh Graduate', subtitle: 'Students and early-career professionals',
    recommendedTemplate: 'graduate-profile',
    intakeHighlights: ['Education and coursework first', 'Internships and academic projects', 'Certifications and awards', 'Printable CV link'],
    copy: { titlePlaceholder: 'e.g. B.Tech Computer Science Graduate', headlinePlaceholder: 'One sentence on what you are studying and looking for', bioHint: 'Describe what you studied, what you enjoy building and the role you are looking for.', skillsHeading: 'Skills', skillPlaceholder: 'e.g. Python, SQL, Public speaking, Figma', projectsHeading: 'Projects', projectNoun: 'project', projectsHint: 'Include class, personal and internship projects with a code or demo link.' },
    skillCategories: ['Technical', 'Tools', 'Languages', 'Soft skills'],
    skillSuggestions: ['Python', 'Java', 'SQL', 'React', 'Communication', 'Teamwork'],
    projectCategories: ['Academic', 'Personal', 'Internship', 'Hackathon', 'Research', 'Volunteer'],
    projectFields: ['summary', 'category', 'year', 'role', 'tools', 'githubUrl', 'liveUrl', 'image'],
    requiredWork: 'projects_or_education', socialLinks: [LINKEDIN, GITHUB, WEBSITE, link('kaggle', 'Kaggle', 'https://kaggle.com/…')],
    extras: [], educationHint: 'Your degree, school, years, grades and relevant coursework.'
  },
  data_scientist: {
    id: 'data_scientist', label: 'Data Scientist / AI Engineer', subtitle: 'ML engineers, data scientists and researchers',
    recommendedTemplate: 'data-ai-lab',
    intakeHighlights: ['Publications with abstract and BibTeX', 'Models, methods and tooling', 'GitHub, Kaggle and notebooks', 'Research and industry experience'],
    copy: { titlePlaceholder: 'e.g. Machine Learning Engineer', headlinePlaceholder: 'One sentence on the problems you solve with data', bioHint: 'Describe your research or applied work, your methods and the impact of your models.', skillsHeading: 'Methods, models and tools', skillPlaceholder: 'e.g. PyTorch, NLP, MLOps, Spark', projectsHeading: 'Projects and notebooks', projectNoun: 'project', projectsHint: 'Add models, papers with code and notebooks, with repository and demo links.' },
    skillCategories: ['Methods', 'Frameworks', 'Data & infra', 'Languages', 'Domains'],
    skillSuggestions: ['PyTorch', 'TensorFlow', 'NLP', 'Computer vision', 'SQL', 'Spark', 'MLOps'],
    projectCategories: ['Machine learning', 'NLP', 'Computer vision', 'Analytics', 'Research', 'MLOps'],
    projectFields: ['summary', 'category', 'year', 'role', 'tools', 'githubUrl', 'liveUrl', 'caseStudyUrl', 'image'],
    requiredWork: 'projects', socialLinks: [GITHUB, link('kaggle', 'Kaggle', 'https://kaggle.com/…'), link('scholar', 'Google Scholar', 'https://scholar.google.com/…'), link('huggingface', 'Hugging Face', 'https://huggingface.co/…'), LINKEDIN, WEBSITE],
    extras: ['publications'], educationHint: 'Degrees, thesis topics and advisors.'
  },
  architect: {
    id: 'architect', label: 'Architect / Interior Designer', subtitle: 'Architects, interior and landscape designers',
    recommendedTemplate: 'architect-minimal',
    intakeHighlights: ['Projects with location, year and area', 'Drawings, renders and site photographs', 'Studio statement and services', 'Awards and registrations'],
    copy: { titlePlaceholder: 'e.g. Architect & Interior Designer', headlinePlaceholder: 'One sentence on your design philosophy', bioHint: 'Describe your studio’s approach, materials and the kinds of spaces you design.', skillsHeading: 'Expertise and software', skillPlaceholder: 'e.g. Residential design, Revit, Sustainable design', projectsHeading: 'Projects', projectNoun: 'project', projectsHint: 'Add each built or unbuilt project with location, year, area and strong images.' },
    skillCategories: ['Design', 'Software', 'Sustainability', 'Management'],
    skillSuggestions: ['Residential', 'Interiors', 'Revit', 'AutoCAD', 'SketchUp', 'Sustainable design'],
    projectCategories: ['Residential', 'Commercial', 'Interior', 'Cultural', 'Landscape', 'Unbuilt'],
    projectFields: ['summary', 'category', 'year', 'location', 'area', 'client', 'role', 'image', 'gallery'],
    requiredWork: 'projects', socialLinks: [INSTAGRAM, LINKEDIN, BEHANCE, link('issuu', 'Issuu / portfolio PDF', 'https://issuu.com/…'), WEBSITE],
    extras: ['services', 'testimonials'], educationHint: 'Architecture degree, registration (COA / RIBA) and affiliations.'
  },
  content_creator: {
    id: 'content_creator', label: 'Content Creator', subtitle: 'YouTubers, streamers, bloggers and personal brands',
    recommendedTemplate: 'creator-media',
    intakeHighlights: ['Platform links and audience stats', 'Top videos and content', 'Collaboration packages', 'Brand-partner enquiry'],
    copy: { titlePlaceholder: 'e.g. Travel & Lifestyle Creator', headlinePlaceholder: 'One sentence on what your audience gets from you', bioHint: 'Describe your content, your audience and the brands you have worked with.', skillsHeading: 'Content topics and skills', skillPlaceholder: 'e.g. Video editing, Storytelling, Travel, Short-form', projectsHeading: 'Top content and campaigns', projectNoun: 'item', projectsHint: 'Add your best videos, series and brand campaigns with a link and thumbnail.' },
    skillCategories: ['Content', 'Production', 'Platforms', 'Audience'],
    skillSuggestions: ['Video editing', 'Storytelling', 'Short-form video', 'Photography', 'SEO'],
    projectCategories: ['Video', 'Series', 'Brand campaign', 'Podcast', 'Blog', 'Live stream'],
    projectFields: ['summary', 'category', 'year', 'client', 'videoUrl', 'liveUrl', 'image'],
    requiredWork: 'projects_or_services', socialLinks: [YOUTUBE, INSTAGRAM, link('tiktok', 'TikTok', 'https://tiktok.com/@…'), link('x', 'X / Twitter', 'https://x.com/…'), link('twitch', 'Twitch', 'https://twitch.tv/…'), WEBSITE],
    extras: ['services', 'testimonials'], educationHint: 'Optional: courses, certifications or awards.'
  }
};

/** Cards shown in New Portfolio, in display order (one per template profession). */
export const PROFESSION_ORDER: (keyof typeof PROFESSIONS)[] = [
  'developer', 'designer', 'photographer', 'graphic_artist', 'motion_3d', 'freelancer', 'student_grad', 'data_scientist', 'architect', 'content_creator'
];

/** Config for any archetype. Legacy archetypes (academic_pro, personal_brand) borrow the closest current one. */
export function getProfession(archetype: PortfolioArchetype): ProfessionConfig {
  if (archetype === 'academic_pro') return PROFESSIONS.data_scientist;
  if (archetype === 'personal_brand') return PROFESSIONS.freelancer;
  return PROFESSIONS[archetype] || PROFESSIONS.freelancer;
}

/** Guard that keeps the two registries in step: every recommended template must be the registry default. */
export function recommendedTemplateFor(archetype: PortfolioArchetype): PortfolioTemplateId {
  return DEFAULT_TEMPLATE_BY_ARCHETYPE[archetype] || getProfession(archetype).recommendedTemplate;
}
