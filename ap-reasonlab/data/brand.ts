export type Collaborator = {
  name: string;
  role: string;
  github: string;
  avatar?: string;
  org?: string;
};

/** People on the TrueJet / Results collaborator roster (GitHub-linked). */
export const trueJetMembers: Collaborator[] = [
  {
    name: "lord-navy-crypto",
    role: "Founder / Full Admin",
    github: "https://github.com/lord-navy-crypto",
    avatar: "https://avatars.githubusercontent.com/u/294130745?v=4",
    org: "TrueJet",
  },
  {
    name: "shulai-ui",
    role: "Partner (GitHub write)",
    github: "https://github.com/shulai-ui",
    avatar: "https://avatars.githubusercontent.com/u/85793645?v=4",
    org: "TrueJet",
  },
];

/** @deprecated Prefer trueJetMembers — kept for older imports */
export const collaborators = [
  ...trueJetMembers,
  {
    name: "Open partner seat",
    role: "Add yourself on Partners with name + GitHub",
    github: "/partners",
    avatar: "",
  },
];

export const brand = {
  name: "Results",
  tagline: "Academic box & platform — learn by reasoning",
  description:
    "Results is an academic platform. AP is one box inside it — with room for A-Level, IB, code resources, and more.",
};
