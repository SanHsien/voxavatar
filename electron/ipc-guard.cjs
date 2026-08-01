"use strict";

const { isAllowedRendererNavigation } = require("./navigation-policy.cjs");

function senderUrlFromEvent(event) {
  try {
    const frameUrl = event?.senderFrame?.url;
    if (typeof frameUrl === "string" && frameUrl) return frameUrl;
  } catch {
    // senderFrame may throw if the frame navigated away
  }
  try {
    const url = event?.sender?.getURL?.();
    if (typeof url === "string" && url) return url;
  } catch {
    // webContents may already be destroyed
  }
  return null;
}

function isTrustedIpcSender(event, allowedRendererUrls) {
  const senderUrl = senderUrlFromEvent(event);
  if (!senderUrl || !Array.isArray(allowedRendererUrls)) return false;
  return allowedRendererUrls.some(
    (allowed) =>
      typeof allowed === "string" &&
      isAllowedRendererNavigation(senderUrl, allowed),
  );
}

function assertTrustedIpcSender(event, allowedRendererUrls) {
  if (isTrustedIpcSender(event, allowedRendererUrls)) return;
  throw new Error("Unauthorized IPC sender.");
}

module.exports = {
  assertTrustedIpcSender,
  isTrustedIpcSender,
  senderUrlFromEvent,
};
