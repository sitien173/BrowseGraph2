import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import { TagInput } from "../../components/TagInput";
import {
  getCurrentSelection,
  loadCurrentTabContext,
  saveContext,
  type CurrentTabContext,
  type SaveReason
} from "../../services/context";

const SAVE_REASONS: SaveReason[] = ["research", "reference", "todo", "other"];

type EditorStatus = "loading" | "idle" | "saving" | "saved" | "error";

export function ContextEditor(): ReactElement {
  const [tabContext, setTabContext] = useState<CurrentTabContext | null>(null);
  const [note, setNote] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedText, setSelectedText] = useState<string>("");
  const [saveReason, setSaveReason] = useState<SaveReason>("research");
  const [status, setStatus] = useState<EditorStatus>("loading");
  const [statusMessage, setStatusMessage] = useState<string>("Loading context");

  useEffect(() => {
    let isMounted = true;

    loadCurrentTabContext()
      .then(async (context) => {
        const selection = await getCurrentSelection(context.tabId);

        if (!isMounted) {
          return;
        }

        setTabContext(context);
        setNote(context.note);
        setTags(context.tags);
        setSelectedText(selection.length > 0 ? selection : context.selectedText);
        setSaveReason(context.saveReason);
        setStatus("idle");
        setStatusMessage("Ready");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setStatus("error");
        setStatusMessage(
          error instanceof Error ? error.message : "Unable to load context"
        );
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateNote = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    setNote(event.target.value);
  };

  const updateSaveReason = (event: ChangeEvent<HTMLSelectElement>): void => {
    setSaveReason(event.target.value as SaveReason);
  };

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (tabContext === null) {
      return;
    }

    setStatus("saving");
    setStatusMessage("Saving");

    try {
      await saveContext(tabContext.nodeId, {
        note,
        tags,
        selectedText,
        saveReason
      });
      setStatus("saved");
      setStatusMessage("Saved");
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Save failed");
    }
  };

  return (
    <main className="sidepanel-shell">
      <form className="context-form editor-form" onSubmit={submit}>
        <header className="editor-header">
          <p className="eyebrow">Context</p>
          <h1>{tabContext?.title ?? "Current tab"}</h1>
          <p className="url-line">{tabContext?.url ?? ""}</p>
        </header>
        <label className="field">
          <span>Note</span>
          <textarea
            value={note}
            onChange={updateNote}
            rows={10}
            disabled={status === "loading"}
          />
        </label>
        <TagInput
          id="sidepanel-tags"
          label="Tags"
          tags={tags}
          onChange={setTags}
        />
        <label className="field">
          <span>Selected text</span>
          <textarea value={selectedText} rows={6} readOnly />
        </label>
        <label className="field">
          <span>Save reason</span>
          <select value={saveReason} onChange={updateSaveReason} required>
            {SAVE_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </label>
        <div className={`status status-${status}`} role="status">
          {statusMessage}
        </div>
        <button
          type="submit"
          disabled={tabContext === null || status === "saving"}
        >
          Save context
        </button>
      </form>
    </main>
  );
}
