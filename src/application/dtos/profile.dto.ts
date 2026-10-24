export interface PortfolioItemDto {
  id: string;
  profileId: string;
  title: string;
  description: string;
  projectUrl: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FreelancerProfileDto {
  id: string;
  userId: string;
  professionalTitle: string | null;
  bio: string | null;
  hourlyRate: number | null;
  skills: string[];
  portfolioItems: PortfolioItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingStepStatusDto {
  stepNumber: number;
  id: 'professional_info' | 'portfolio' | 'skills';
  title: string;
  description: string;
  isCompleted: boolean;
  data?: {
    professionalTitle?: string | null;
    bio?: string | null;
    hourlyRate?: number | null;
    totalItems?: number;
    skills?: string[];
  };
}

export interface OnboardingProgressDto {
  totalSteps: number;
  completedSteps: number;
  percentage: number;
  isFullyCompleted: boolean;
  steps: OnboardingStepStatusDto[];
}
