from __future__ import annotations

from typing import Dict, Iterable, List, Union

from schema import PromptPackage, RenderManifest, RenderResult
from seedance_provider import SeedanceProvider
from sora_provider import SoraProvider


class ProviderRouter:
    """Provider-agnostic routing layer.

    Planning code only speaks through the normalized manifest and prompt package.
    This router decides which adapter should receive the request.
    """

    def __init__(self) -> None:
        self.providers: Dict[str, object] = {
            "sora": SoraProvider(),
            "seedance": SeedanceProvider(),
        }
        self.primary_model = "sora-2-pro"
        self.fallback_model = "sora-2"
        self.optional_alt_model = "seedance-2.0"

    def render(self, prompt: Union[PromptPackage, str], manifest: RenderManifest) -> RenderResult:
        prompt_text = prompt.final_prompt if isinstance(prompt, PromptPackage) else str(prompt)
        candidates = self._candidate_models(manifest)
        last_error = None

        for provider_name, model_name in candidates:
            provider = self.providers[provider_name]
            working_manifest = RenderManifest(**manifest.to_dict())
            working_manifest.model = model_name
            if getattr(working_manifest, "provider", "auto") == "auto":
                working_manifest.provider = provider_name
            try:
                return provider.render(prompt_text, working_manifest)
            except Exception as exc:  # pragma: no cover - defensive fallback path
                last_error = exc
                continue

        raise RuntimeError(f"All provider routes failed. Last error: {last_error}")

    def _candidate_models(self, manifest: RenderManifest) -> List[tuple[str, str]]:
        explicit_provider = (manifest.provider or "auto").lower()
        explicit_model = manifest.model or self.primary_model

        if explicit_provider == "seedance" or explicit_model.startswith("seedance"):
            return [("seedance", explicit_model), ("sora", self.primary_model), ("sora", self.fallback_model)]

        if explicit_provider == "sora":
            requested = explicit_model if explicit_model in {self.primary_model, self.fallback_model} else self.primary_model
            fallbacks = [self.fallback_model] if requested != self.fallback_model else []
            return [("sora", requested)] + [("sora", model) for model in fallbacks]

        if explicit_model == self.optional_alt_model:
            return [("seedance", self.optional_alt_model), ("sora", self.primary_model), ("sora", self.fallback_model)]
        if explicit_model == self.fallback_model:
            return [("sora", self.fallback_model), ("sora", self.primary_model), ("seedance", self.optional_alt_model)]
        return [("sora", self.primary_model), ("sora", self.fallback_model), ("seedance", self.optional_alt_model)]


def render_video(prompt: Union[PromptPackage, str], manifest: RenderManifest, router: ProviderRouter | None = None) -> RenderResult:
    active_router = router or ProviderRouter()
    return active_router.render(prompt, manifest)
