"use strict";

/**
 * 匯入／分槽確認對話框的選項組裝（純函式，不含 dialog.showMessageBox）。
 */

function buildDirectoryImportConfirmOptions({
  t,
  kind,
  scanned,
  importCount,
  quality,
  skippedQuality,
}) {
  const detail = quality
    ? String(t.importConfirmDetailQuality)
        .replaceAll("{scanned}", String(scanned))
        .replaceAll("{import}", String(importCount))
        .replaceAll("{keep}", String(quality.keep ?? 0))
        .replaceAll("{review}", String(quality.review ?? 0))
        .replaceAll("{reject}", String(quality.reject ?? 0))
        .replaceAll("{skipped}", String(skippedQuality ?? 0))
    : String(t.importConfirmDetailOff)
        .replaceAll("{scanned}", String(scanned))
        .replaceAll("{import}", String(importCount));
  return {
    type: "question",
    title: t.importConfirmTitle,
    message:
      kind === "model"
        ? t.importConfirmMessageModel
        : t.importConfirmMessageAnimation,
    detail,
    buttons: [t.importConfirmProceed, t.importConfirmCancel],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  };
}

function buildAssignByFilenameConfirmOptions({
  t,
  assignable,
  skipped,
  total,
}) {
  const list = Array.isArray(assignable) ? assignable : [];
  const lines = list
    .slice(0, 12)
    .map((item) => `${item.basename} → ${item.animationName}`);
  if (list.length > 12) {
    lines.push(`… +${list.length - 12}`);
  }
  const detail = [
    String(t.assignConfirmDetail ?? "")
      .replaceAll("{assign}", String(list.length))
      .replaceAll("{skipped}", String(skipped ?? 0))
      .replaceAll("{total}", String(total ?? 0)),
    "",
    ...lines,
  ]
    .filter((line) => line != null)
    .join("\n");
  return {
    type: "question",
    title: t.assignConfirmTitle ?? t.importConfirmTitle,
    message: t.assignConfirmMessage ?? t.importConfirmMessageAnimation,
    detail,
    buttons: [
      t.assignConfirmProceed ?? t.importConfirmProceed,
      t.assignConfirmCancel ?? t.importConfirmCancel,
    ],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  };
}

module.exports = {
  buildAssignByFilenameConfirmOptions,
  buildDirectoryImportConfirmOptions,
};
