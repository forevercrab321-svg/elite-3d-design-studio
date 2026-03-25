from __future__ import annotations

from typing import Any, Dict

from schema import ProviderCapabilities, RenderManifest, RenderResult


class SoraProvider:
    """Placeholder adapter for Sora-family models.

    The adapter keeps provider-specific payload mapping isolated from planning logic.
    It does not claim a public API contract. It only produces a normalized payload preview
    and a normalized render result that downstream QC can consume.
    """

    def __init__(self) -> None:
        self.capabilities = ProviderCapabilities(
            name="sora",
            models=["sora-2-pro", "sora-2"],
            supports_text_to_video=True,
            supports_image_to_video=True,
            supports_character_reference_reuse=True,
            supports_video_extension=True,
            supports_targeted_edit=True,
            supports_audio_conditioning=False,
        )

    def supports_model(self, model: str) -> bool:
        return model in self.capabilities.models

    def render(self, prompt_text: str, manifest: RenderManifest) -> RenderResult:
        payload_preview: Dict[str, Any] = {
            "mode": manifest.operation,
            "model": manifest.model,
            "duration_seconds": manifest.duration,
            "resolution": manifest.resolution,
            "fps": manifest.fps,
            "prompt": prompt_text,
            "reference_ids": [asset.id for asset in manifest.reference_assets],
            "character_reference_ids": manifest.character_reference_ids,
            "extension_chain": manifest.extension_chain,
            "edit_chain": manifest.edit_chain,
        }

        return RenderResult(
            status="placeholder_ready",
            provider=self.capabilities.name,
            model=manifest.model,
            prompt_used=prompt_text,
            asset_ids=[asset.id for asset in manifest.reference_assets],
            video_path_or_url=f"placeholder://sora/{manifest.model}/{manifest.shot_id or 'shot'}.mp4",
            qc_ready_metadata={
                "adapter_payload_preview": payload_preview,
                "supports_targeted_edit": self.capabilities.supports_targeted_edit,
                "supports_video_extension": self.capabilities.supports_video_extension,
                "used_reference_ids": [asset.id for asset in manifest.reference_assets],
                "simulated_findings": {},
            },
        )
