from __future__ import annotations

from providers.base import DataProvider


class ProviderRegistry:
    def __init__(self, providers: list[DataProvider]) -> None:
        self._providers = providers

    def get_provider(self, dataset_id: str) -> DataProvider | None:
        for provider in self._providers:
            if provider.supports(dataset_id):
                return provider
        return None
