import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import { TagInput } from "../../components/TagInput";
import {
  loadCurrentTabContext,
  saveContext,
  type CurrentTabContext
} from "../../services/context";

type SaveStatus = "loading" | "idle" | "saving" | "saved" | "error";

export function PopupApp(): ReactElement {
  const [tabContext, setTabContext] = useState<CurrentTabContext | null>(null);
  const [note, setNote] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<SaveStatus>("loading");
  const [statusMessage, setStatusMessage] = useState<string>("Loading tab");

  useEffect(() => {
    let isMounted = true;

    loadCurrentTabContext()
      .then((context) => {
        if (!isMounted) {
          return;
        }

        setTabContext(context);
        setNote(context.note);
        setTags(context.tags);
        setStatus("idle");
        setStatusMessage("Ready");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setStatus("error");
        setStatusMessage(
          error instanceof Error ? error.message : "Unable to load tab"
        );
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateNote = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    setNote(event.target.value);
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
        saveReason: "reference"
      });
      setStatus("saved");
      setStatusMessage("Saved");
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Save failed");
    }
  };

  return (
    <main className="popup-shell">
      <form className="context-form popup-form" onSubmit={submit}>
        <header>
          <p className="eyebrow">Quick save</p>
          <h1>{tabContext?.title ?? "Current tab"}</h1>
          <p className="url-line">{tabContext?.url ?? ""}</p>
        </header>
        <label className="field">
          <span>Note</span>
          <textarea
            value={note}
            onChange={updateNote}
            rows={5}
            disabled={status === "loading"}
          />
        </label>
        <TagInput id="popup-tags" label="Tags" tags={tags} onChange={setTags} />
        <div className={`status status-${status}`} role="status">
          {statusMessage}
        </div>
        <button
          type="submit"
          disabled={tabContext === null || status === "saving"}
        >
          Save
        </button>
      </form>
    </main>
  );
}
