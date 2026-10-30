import { Budget } from "../value-objects/budget.vo.js";
import { SkillTags } from "../value-objects/skill-tags.vo.js";
import {
    InvalidProjectTitleException,
    InvalidProjectDescriptionException,
    InvalidEstimatedDateException
} from '../exceptions/domain.exception.js';

export enum ProjectStatus {
    ACTIVE = 'ACTIVE',
    CLOSED = 'CLOSED'
}

export interface ProjectProps {
    id: string;
    clientId: string;
    title: string;
    description: string;
    budget: Budget;
    skills: SkillTags;
    estimatedDate: Date;
    status: ProjectStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateProjectProps {
    id: string;
    clientId: string;
    title: string;
    description: string;
    budget: number;
    skills: string[];
    estimatedDate: Date;
}

/**
 * Entidad de dominio => Convocatoria / Proyecto publicado por un cliente
 */

export class Project {
    public static readonly MIN_TITLE_LENGHT = 10;
    public static readonly MIN_DESCRIPTION_LENGTH = 30;

    private readonly _id: string;
    private readonly _clientId: string;
    private readonly _title: string;
    private readonly _description: string;
    private readonly _budget: Budget;
    private readonly _skills: SkillTags;
    private readonly _estimatedDate: Date;
    private _status: ProjectStatus;
    private readonly _createdAt: Date;
    private _updatedAt: Date;

    constructor(props: ProjectProps) {
        this._id = props.id;
        this._clientId = props.clientId;
        this._title = props.title;
        this._description = props.description;
        this._budget = props.budget;
        this._skills = props.skills;
        this._estimatedDate = props.estimatedDate;
        this._status = props.status;
        this._createdAt = props.createdAt;
        this._updatedAt = props.updatedAt;
    }

    /**
     * Validaciones fail-fast 
     */

    public static create(props: CreateProjectProps, ahora: Date = new Date()): Project {
        const title = (props.title ?? '').trim();

        if (title.length < Project.MIN_TITLE_LENGHT) {
            throw new InvalidProjectTitleException(Project.MIN_TITLE_LENGHT);
        }

        const description = (props.description ?? '').trim();

        if (description.length < Project.MIN_DESCRIPTION_LENGTH) {
            throw new InvalidProjectDescriptionException(Project.MIN_DESCRIPTION_LENGTH);
        }

        const budget = new Budget(props.budget);
        const skills = new SkillTags(props.skills);

        if (!(props.estimatedDate instanceof Date) || Number.isNaN(props.estimatedDate.getTime()) || props.estimatedDate.getTime() <= ahora.getTime()) {
            throw new InvalidEstimatedDateException();
        }

        return new Project({
            id: props.id,
            clientId: props.clientId,
            title,
            description,
            budget,
            skills,
            estimatedDate: props.estimatedDate,
            status: ProjectStatus.ACTIVE,
            createdAt: ahora,
            updatedAt: ahora
        });
    }

    public get id(): string {
        return this._id;
    }

    public get clientId(): string {
        return this._clientId;
    }

    public get title(): string {
        return this._title;
    }

    public get description(): string {
        return this._description;
    }

    public get budget(): Budget {
        return this._budget;
    }

    public get skills(): SkillTags {
        return this._skills;
    }

    public get estimatedDate(): Date {
        return this._estimatedDate;
    }

    public get status(): ProjectStatus {
        return this._status;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }

    public get updatedAt(): Date {
        return this._updatedAt;
    }
}
