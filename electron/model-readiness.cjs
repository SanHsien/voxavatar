"use strict";

function snapshotHasConfiguredModel(snapshot) {
  return (
    snapshot?.default_model_id != null &&
    Array.isArray(snapshot.models) &&
    snapshot.models.some(
      (model) => model?.id === snapshot.default_model_id,
    )
  );
}

module.exports = { snapshotHasConfiguredModel };
