import * as React from "react";
import { Link } from "remix";
import type { NonNullProperties, User, Request } from "../types";
import * as dateFns from "date-fns";

type AnchorProps = React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
>;

const AnchorOrLink = React.forwardRef<HTMLAnchorElement, AnchorProps>(
  function AnchorOrLink(props, ref) {
    const { href = "", ...rest } = props;
    if (href.startsWith("http") || href.startsWith("#")) {
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      return <a {...props} ref={ref} />;
    } else {
      return <Link to={href} {...rest} ref={ref} />;
    }
  }
);

// unfortunately TypeScript doesn't have Intl.ListFormat yet 😢
// so we'll just add it ourselves:
type ListFormatOptions = {
  type?: "conjunction" | "disjunction" | "unit";
  style?: "long" | "short" | "narrow";
  localeMatcher?: "lookup" | "best fit";
};
declare namespace Intl {
  class ListFormat {
    constructor(locale: string, options: ListFormatOptions);
    public format: (items: Array<string>) => string;
  }
}

type ListifyOptions<ItemType> = {
  type?: ListFormatOptions["type"];
  style?: ListFormatOptions["style"];
  stringify?: (item: ItemType) => string;
};
function listify<ItemType>(
  array: Array<ItemType>,
  {
    type = "conjunction",
    style = "long",
    stringify = (thing: { toString(): string }) => thing.toString(),
  }: ListifyOptions<ItemType> = {}
) {
  const stringified = array.map((item) => stringify(item));
  const formatter = new Intl.ListFormat("en", { style, type });
  return formatter.format(stringified);
}

function formatTime(seconds: number) {
  return dateFns.format(dateFns.addSeconds(new Date(0), seconds), "mm:ss");
}

function getErrorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Unknown Error";
}

function getErrorStack(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.stack;
  return "Unknown Error";
}

function getNonNull<Type extends Record<string, null | undefined | unknown>>(
  obj: Type
): NonNullProperties<Type> {
  for (const [key, val] of Object.entries(obj)) {
    assertNonNull(val, `The value of ${key} is null but it should not be.`);
  }
  return obj as NonNullProperties<Type>;
}

function typedBoolean<T>(
  value: T
): value is Exclude<T, "" | 0 | false | null | undefined> {
  return Boolean(value);
}

function assertNonNull<PossibleNullType>(
  possibleNull: PossibleNullType,
  errorMessage: string
): asserts possibleNull is Exclude<PossibleNullType, null | undefined> {
  if (possibleNull == null) throw new Error(errorMessage);
}

function getRequiredEnvVarFromObj(
  obj: Record<string, string | undefined>,
  key: string,
  devValue: string = `${key}-dev-value`
) {
  let value = devValue;
  const envVal = obj[key];
  if (envVal) {
    value = envVal;
  } else if (obj.NODE_ENV === "production") {
    throw new Error(`${key} is a required env variable`);
  }
  return value;
}

function getRequiredServerEnvVar(key: string, devValue?: string) {
  return getRequiredEnvVarFromObj(process.env, key, devValue);
}

function getDomainUrl(request: Request) {
  const host =
    request.headers.get("X-Forwarded-Host") ?? request.headers.get("host");
  if (!host) {
    throw new Error("Could not determine domain URL.");
  }
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export {
  AnchorOrLink,
  getErrorMessage,
  getErrorStack,
  getNonNull,
  assertNonNull,
  listify,
  typedBoolean,
  getRequiredServerEnvVar,
  getDomainUrl,
  formatTime,
};
