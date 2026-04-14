interface SelectionRequestMessage {
  type?: string;
}

interface SelectionResponseMessage {
  selectedText: string;
}

const GET_SELECTION_MESSAGE = "GET_SELECTION";

const getSelectedText = (): string => window.getSelection()?.toString() ?? "";

chrome.runtime.onMessage.addListener(
  (
    message: SelectionRequestMessage,
    _sender,
    sendResponse: (response: SelectionResponseMessage) => void
  ): boolean => {
    if (message.type !== GET_SELECTION_MESSAGE) {
      return false;
    }

    sendResponse({ selectedText: getSelectedText() });

    return false;
  }
);
