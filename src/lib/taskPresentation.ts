export function formatTaskDisplayTitle({
  progress,
  title,
}: {
  progress: number;
  title: string;
}) {
  return progress > 0 ? `${progress}% ${title}` : title;
}
