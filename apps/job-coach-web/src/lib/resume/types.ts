export type ResumeBasics = {
  fullName: string;
  name: string;
  headline?: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  summary?: string;
};

export type ResumeSkillGroup = {
  category: string;
  items: string[];
};

export type ResumeExperience = {
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
};

export type ResumeEducation = {
  school: string;
  degree?: string;
  field?: string;
  startYear?: string;
  endYear?: string;
  details: string[];
};

export type NormalizedResume = {
  basics: ResumeBasics;
  skills: ResumeSkillGroup[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  rawText: string;
  originalFile?: {
    name: string;
    type: string;
    dataBase64: string;
  };
};
