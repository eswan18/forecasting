import * as React from "react";

/**
 * Storybook stand-in for `next/image`: render a plain img.
 *
 * The real component resolves every src through Next's optimizer endpoint
 * (`/_next/image?url=…`), which only the Next server serves — under Storybook
 * it is a 404, so a story for anything with a photo in it shows a broken image.
 * Rendering the src directly is what the story is actually testing anyway: the
 * box the picture sits in, not the pipeline that fetches it.
 */
type ImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "width" | "height"
> & {
  src: string | { src: string };
  alt: string;
  width?: number | string;
  height?: number | string;
  /* Next-only props, accepted so callers type-check and dropped before the DOM
     sees them — React would warn about every one of these on an <img>. */
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
  placeholder?: string;
  blurDataURL?: string;
  loader?: unknown;
  sizes?: string;
};

export default function Image({
  src,
  alt,
  width,
  height,
  fill: _fill,
  priority: _priority,
  quality: _quality,
  unoptimized: _unoptimized,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  loader: _loader,
  sizes: _sizes,
  ...props
}: ImageProps) {
  const srcStr = typeof src === "string" ? src : src.src;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={srcStr} alt={alt} width={width} height={height} {...props} />;
}
