import { Phone } from '../value-objects/phone.vo.js';

export class Skill {
  constructor(public readonly id: string, public readonly name: string) {}
}

export class PortfolioItem {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly projectUrl: string,
    public readonly imageUrl?: string | null
  ) {}
}

export class Profile {
  constructor(
    public readonly userId: string,
    public firstName: string,
    public lastName: string,
    public bio?: string,
    public phone?: Phone | string,
    public avatarUrl?: string,
    public professionalTitle?: string,
    public hourlyRate?: number,
    public skills: any[] = [],
    public portfolioItems: PortfolioItem[] = []
  ) {}

  public updateDetails(data: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    phone?: Phone | string;
    professionalTitle?: string;
    hourlyRate?: number;
  }): void {
    if (data.firstName !== undefined) this.firstName = data.firstName;
    if (data.lastName !== undefined) this.lastName = data.lastName;
    if (data.bio !== undefined) this.bio = data.bio;
    if (data.phone !== undefined) this.phone = data.phone;
    if (data.professionalTitle !== undefined) this.professionalTitle = data.professionalTitle;
    if (data.hourlyRate !== undefined) this.hourlyRate = data.hourlyRate;
  }

  public updateAvatar(avatarUrl: string): void {
    this.avatarUrl = avatarUrl;
  }

  public setSkills(skills: any[]): void {
    this.skills = skills;
  }

  public addPortfolioItem(item: PortfolioItem): void {
    this.portfolioItems.unshift(item);
  }

  public removePortfolioItem(itemId: string): void {
    this.portfolioItems = this.portfolioItems.filter((item) => item.id !== itemId);
  }
}