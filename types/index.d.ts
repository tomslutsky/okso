import calculateReadingTime from "reading-time";
import type { Request, Response } from "node-fetch";
import type { ActionFunction, LoaderFunction } from "remix";
import type { User, Call, Session, Team, Role } from "@prisma/client";

type NonNullProperties<Type> = {
  [Key in keyof Type]-?: Exclude<Type[Key], null | undefined>;
};
type Await<Type> = Type extends Promise<infer Value> ? Await<Value> : Type;

type MdxPage = {
  code: string;
  slug: string;
  readTime?: ReturnType<typeof calculateReadingTime>;

  /**
   * It's annoying that all these are set to optional I know, but there's
   * no great way to ensure that the MDX files have these properties,
   * especially when a common use case will be to edit them without running
   * the app or build. So we're going to force you to handle situations when
   * these values are missing to avoid runtime errors.
   */
  frontmatter: {
    title?: string;
    description?: string;
    meta?: {
      keywords?: Array<string>;
      [key as string]: string;
    };

    // Post meta
    categories?: Array<string>;
    date?: string;
    bannerUrl?: string;
    bannerCredit?: string;
    bannerAlt?: string;
    translations?: Array<{
      language: string;
      link: string;
      author?: {
        name: string;
        link?: string;
      };
    }>;
  };
};

/**
 * This is a separate type from MdxPage because the code string is often
 * pretty big and the pages that simply list the pages shouldn't include the code.
 */
type MdxListItem = Omit<MdxPage, "code">;

type Workshop = {
  slug: string;
  title: string;
  description: string;
  categories: Array<string>;
  meta?: Record<string, string>;
  testimonials: Array<Testimonial>;
  problemStatementHTMLs: ProblemStatements;
  keyTakeawayHTMLs: Array<KeyTakeaway>;
  topicHTMLs: Array<string>;
  prerequisiteHTML: string;
};

type Link = {
  name: string;
  url: string;
};
/**
 * Chats with Kent Podcast Episode
 */
type CWKEpisode = {
  slug: string;
  title: string;
  meta?: {
    keywords?: Array<string>;
    [key as string]: string;
  };
  descriptionHTML: string;
  summaryHTML: string;
  seasonNumber: number;
  episodeNumber: number;
  homeworkHTMLs: Array<string>;
  resources: Array<Link>;
  image: string;
  guests: Array<{
    name: string;
    company?: string;
    github?: string;
    twitter?: string;
  }>;
  duration: number;
  transcriptHTML: string;
  simpleCastId: string;
};

/**
 * Chats with Kent Podcast List Item
 */
type CWKListItem = Pick<
  CWKEpisode,
  | "slug"
  | "title"
  | "seasonNumber"
  | "episodeNumber"
  | "image"
  | "guests"
  | "duration"
  | "simpleCastId"
>;

type CWKSeason = {
  seasonNumber: number;
  episodes: Array<CWKListItem>;
};

type CallKentEpisode = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  keywords: string;
  duration: number;
  shareUrl: string;
  mediaUrl: string;
  embedHtml: string;
  embedHtmlDark: string;
  imageUrl: string;
  publishedAt: string;
};

type KCDHandle = {
  metas?: Array<JSX.IntrinsicElements["meta"]>;
  scroll?: false;
};

type KCDLoader<
  Params extends Record<string, unknown> = Record<string, unknown>
> = (
  args: Omit<Parameters<LoaderFunction>["0"], "params"> & { params: Params }
) => ReturnType<LoaderFunction>;

type KCDAction<
  Params extends Record<string, unknown> = Record<string, unknown>
> = (
  args: Omit<Parameters<ActionFunction>["0"], "params"> & { params: Params }
) => ReturnType<ActionFunction>;

type GitHubFile = { path: string; content: string };

export {
  Request,
  Response,
  NonNullProperties,
  Await,
  User,
  Call,
  Session,
  Team,
  Role,
  MdxPage,
  MdxListItem,
  Workshop,
  CWKEpisode,
  CWKListItem,
  CWKSeason,
  CallKentEpisode,
  KCDLoader,
  KCDAction,
  KCDHandle,
  GitHubFile,
};
