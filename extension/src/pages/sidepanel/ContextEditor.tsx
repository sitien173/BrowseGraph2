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
        setStatusMessage("Ready to save updates");
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

  const markDirty = (): void => {
    if (status === "saved" || status === "error") {
      setStatus("idle");
      setStatusMessage("Unsaved changes");
    }
  };

  const updateNote = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    setNote(event.target.value);
    markDirty();
  };

  const updateSaveReason = (event: ChangeEvent<HTMLSelectElement>): void => {
    setSaveReason(event.target.value as SaveReason);
    markDirty();
  };

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (tabContext === null) {
      return;
    }

    setStatus("saving");
    setStatusMessage("Saving context");

    try {
      await saveContext(tabContext.nodeId, {
        note,
        tags,
        selectedText,
        saveReason
      });
      setStatus("saved");
      setStatusMessage("Context saved");
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Save failed");
    }
  };

  return (
    <main className="sidepanel-shell">
      <form className="context-form editor-form" onSubmit={submit}>
        <header className="editor-header">
          <p className="panel-kicker">Context Capture</p>
          <h2>{tabContext?.title ?? "Current tab"}</h2>
          <p className="url-line">{tabContext?.url ?? ""}</p>
        </header>

        <section className="meta-grid" aria-label="Tab metadata">
          <div className="meta-card">
            <span>Normalized URL</span>
            <strong>{tabContext?.normalizedUrl ?? "-"}</strong>
          </div>
          <div className="meta-card">
            <span>Node ID</span>
            <strong>{tabContext?.nodeId ?? "-"}</strong>
          </div>
          <div className="meta-card">
            <span>Tab ID</span>
            <strong>{tabContext?.tabId ?? "-"}</strong>
          </div>
        </section>

        <label className="field">
          <span>Note</span>
          <textarea
            value={note}
            onChange={updateNote}
            rows={8}
            disabled={status === "loading"}
            placeholder="Capture why this page matters..."
          />
        </label>

        <TagInput
          id="sidepanel-tags"
          label="Tags"
          tags={tags}
          onChange={(nextTags) => {
            setTags(nextTags);
            markDirty();
          }}
        />

        <label className="field">
          <span>Selected text</span>
          <textarea value={selectedText} rows={5} readOnly />
        </label>

        <label className="field compact-field">
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
          className="primary-btn submit-btn"
          disabled={tabContext === null || status === "saving"}
        >
          {status === "saving" ? "Saving..." : "Save context"}
        </button>
      </form>
    </main>
  );
}
