<x-filament-widgets::widget>
	<x-filament::section>
		<div class="space-y-1">
			<p class="text-primary-600 dark:text-primary-400 text-xs font-semibold uppercase tracking-wide">
				{{ $this->eyebrow }}
			</p>

			<h2 class="text-xl font-bold tracking-tight text-gray-950 dark:text-white">
				{{ $this->title }}
			</h2>

			@if ($this->description)
				<p class="text-sm text-gray-500 dark:text-gray-400">
					{{ $this->description }}
				</p>
			@endif
		</div>
	</x-filament::section>
</x-filament-widgets::widget>
