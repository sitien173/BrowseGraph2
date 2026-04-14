import { useState } from "react";
import type { ChangeEvent, KeyboardEvent, ReactElement } from "react";

interface TagInputProps {
  id: string;
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}

export const slugifyTagName = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const uniqueTags = (tags: string[]): string[] =>
  Array.from(
    new Map(
      tags
        .map((tag) => ({ name: tag.trim(), slug: slugifyTagName(tag) }))
        .filter((tag) => tag.name.length > 0 && tag.slug.length > 0)
        .map((tag) => [tag.slug, tag.name])
    ).values()
  );

const parseTagText = (value: string): string[] =>
  uniqueTags(value.split(",").map((tag) => tag.trim()));

export function TagInput({
  id,
  label,
  tags,
  onChange
}: TagInputProps): ReactElement {
  const [draft, setDraft] = useState<string>("");

  const commitDraft = (): void => {
    const parsedTags = parseTagText(draft);

    if (parsedTags.length === 0) {
      setDraft("");
      return;
    }

    onChange(uniqueTags([...tags, ...parsedTags]));
    setDraft("");
  };

  const updateDraft = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;

    if (value.includes(",")) {
      const parts = value.split(",");
      const completeTags = uniqueTags(parts.slice(0, -1));
      onChange(uniqueTags([...tags, ...completeTags]));
      setDraft(parts[parts.length - 1] ?? "");
      return;
    }

    setDraft(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    commitDraft();
  };

  const removeTag = (tagToRemove: string): void => {
    onChange(tags.filter((tag) => slugifyTagName(tag) !== slugifyTagName(tagToRemove)));
  };

  return (
    <label className="field">
      <span>{label}</span>
      <div className="tag-box">
        {tags.map((tag) => (
          <button
            className="tag-pill"
            type="button"
            key={slugifyTagName(tag)}
            onClick={() => removeTag(tag)}
            aria-label={`Remove ${tag}`}
          >
            {tag}
          </button>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          onChange={updateDraft}
          onBlur={commitDraft}
          onKeyDown={handleKeyDown}
          placeholder="Add tags"
        />
      </div>
    </label>
  );
}
