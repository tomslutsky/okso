import * as React from "react";
import { useLoaderData, json, redirect, LoaderFunction } from "remix";
import type { HeadersFunction } from "remix";
import { Link, useParams } from "react-router-dom";
import type { MdxPage } from "../types";
import formatDate from "date-fns/format";

import { getMdxPage, mdxPageMeta, useMdxComponent } from "../lib/mdx";

type LoaderData = {
  page: MdxPage | null;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const page = await getMdxPage(
    {
      contentDir: "blog",
      slug: params.slug as string,
    },
    { request }
  );

  const data: LoaderData = { page };
  const headers = {
    "Cache-Control": "public, max-age=3600",
  };

  /*   if (!page) {
    return redirect("/404");
  }
 */
  return json(data, { status: page ? 200 : 400 });
};

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return {
    "Cache-Control": loaderHeaders.get("Cache-Control") ?? "no-cache",
    "Server-Timing": loaderHeaders.get("Server-Timing") ?? "",
  };
};

export const meta = mdxPageMeta;

export default function MdxScreenBase() {
  const data = useLoaderData();

  if (data.page) return <MdxScreen />;
  else return redirect("/404");
}

function useOnRead({
  parentElRef,
  readTime,
  onRead,
}: {
  parentElRef: React.RefObject<HTMLElement>;
  readTime: MdxPage["readTime"];
  onRead: () => void;
}) {
  React.useEffect(() => {
    const parentEl = parentElRef.current;
    const time = readTime?.time;
    if (!parentEl || !time) return;

    const visibilityEl = document.createElement("div");

    let scrolledTheMain = false;
    const observer = new IntersectionObserver((entries) => {
      const isVisible = entries.some((entry) => {
        return entry.target === visibilityEl && entry.isIntersecting;
      });
      if (isVisible) {
        scrolledTheMain = true;
        maybeMarkAsRead();
        observer.disconnect();
        visibilityEl.remove();
      }
    });

    let startTime = new Date().getTime();
    let timeoutTime = time * 0.6;
    let timerId: ReturnType<typeof setTimeout>;
    let timerFinished = false;
    function startTimer() {
      timerId = setTimeout(() => {
        timerFinished = true;
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        maybeMarkAsRead();
      }, timeoutTime);
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        clearTimeout(timerId);
        const timeElapsedSoFar = new Date().getTime() - startTime;
        timeoutTime = timeoutTime - timeElapsedSoFar;
      } else {
        startTime = new Date().getTime();
        startTimer();
      }
    }

    function maybeMarkAsRead() {
      if (timerFinished && scrolledTheMain) {
        cleanup();
        onRead();
      }
    }

    // dirty-up
    parentEl.append(visibilityEl);
    observer.observe(visibilityEl);
    startTimer();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    function cleanup() {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimeout(timerId);
      observer.disconnect();
      visibilityEl.remove();
    }
    return cleanup;
  }, [readTime, onRead, parentElRef]);
}

function ArticleFooter() {
  return (
    <div>
      <div className="flex flex-col col-span-full justify-between mb-12 pb-12 text-blueGray-500 text-lg font-medium border-b border-gray-600 lg:flex-row lg:col-span-8 lg:col-start-3 lg:pb-6">
        <div className="flex space-x-5">
          <h6>Share article</h6>
          {/* TODO: fix links */}
          <Link
            className="dark:hover:text-white underlined dark:focus:text-white hover:text-black focus:text-black focus:outline-none"
            to="/"
          >
            Facebook
          </Link>
          <Link
            className="dark:hover:text-white underlined dark:focus:text-white hover:text-black focus:text-black focus:outline-none"
            to="/"
          >
            Twitter
          </Link>
        </div>

        <div className="flex">
          <Link
            className="underlined dark:hover:text-white dark:focus:text-white hover:text-black focus:text-black focus:outline-none"
            to="/"
          >
            Discuss on Twitter
          </Link>
          <span className="self-center mx-3 text-xs">•</span>
          <Link
            className="underlined dark:hover:text-white dark:focus:text-white hover:text-black focus:text-black focus:outline-none"
            to="/"
          >
            Edit on GitHub
          </Link>
        </div>
      </div>
      <div className="col-span-full lg:col-span-2 lg:col-start-3"></div>
      <div className="lg:col-start:5 col-span-full lg:col-span-6">
        <h6>Written by Kent C. Dodds</h6>
        <p className="mb-12 mt-3">
          {`
Kent C. Dodds is a JavaScript software engineer and teacher. He's taught
hundreds of thousands of people how to make the world a better place with
quality software development tools and practices. He lives with his wife and
four kids in Utah.
          `.trim()}
        </p>
        <Link to="/about">Learn more about Kent</Link>
      </div>
    </div>
  );
}

function MdxScreen() {
  const data = useLoaderData<LoaderData>();
  if (!data.page) {
    throw new Error(
      "This should be impossible because we only render the MdxScreen if there is a data.page object."
    );
  }

  const { code, frontmatter } = data.page;
  const params = useParams();
  const { slug } = params;
  const Component = useMdxComponent(code);

  const readMarker = React.useRef<HTMLDivElement>(null);
  useOnRead({
    parentElRef: readMarker,
    readTime: data.page.readTime,
    onRead: React.useCallback(() => {
      const searchParams = new URLSearchParams([
        ["_data", "routes/_action/mark-read"],
      ]);
      void fetch(`/_action/mark-read?${searchParams}`, {
        method: "POST",
        body: JSON.stringify({ articleSlug: slug }),
      });
    }, [slug]),
  });

  return (
    <>
      <div className="mb-10 mt-24 lg:mb-24">
        <div className="flex col-span-full justify-between lg:col-span-8 lg:col-start-3"></div>
      </div>

      <div as="header" className="mb-12">
        <div className="col-span-full lg:col-span-8 lg:col-start-3">
          <h2>{frontmatter.title}</h2>
          <h6 as="p" variant="secondary" className="mt-2 lowercase">
            {frontmatter.date
              ? formatDate(new Date(frontmatter.date), "PPP")
              : "some day in the past"}{" "}
            — {data.page.readTime?.text ?? "a quick read"}
          </h6>
        </div>
        <div className="aspect-h-4 aspect-w-3 md:aspect-w-3 md:aspect-h-2 col-span-full mt-10 rounded-lg lg:col-span-10 lg:col-start-2">
          <img
            className="w-full h-full rounded-lg object-cover"
            src={frontmatter.bannerUrl}
            alt={frontmatter.bannerAlt}
          />
        </div>
      </div>

      <main ref={readMarker}>
        <div className="mb-24">
          <div className="col-span-full lg:col-start-3">
            <div className="flex flex-wrap">
              {frontmatter.translations?.length ? (
                <>
                  <ul className="flex flex-wrap col-span-full -mb-4 -mr-4 lg:col-span-10 lg:col-start-3">
                    {frontmatter.translations.map(({ language, link }) => (
                      <li key={`${language}:${link}`}>
                        <a
                          href={link}
                          className="focus-ring bg-secondary text-primary relative block mb-4 mr-4 px-6 py-3 w-auto h-auto whitespace-nowrap rounded-full"
                        >
                          {language}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <span className="text-secondary text-lg italic">
                    No translations available.
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="prose prose-light dark:prose-dark mb-24">
          <Component />
        </div>
      </main>

      <div className="mb-64">
        <ArticleFooter />
      </div>
    </>
  );
}
