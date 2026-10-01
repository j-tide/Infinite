import { Plus } from 'lucide-react';
import { SAMPLE_ASSETS } from '../../canvas/constants';

const descriptions = ['光影 · 沙丘', '自然 · 山峦', '色彩 · 花境'];

export function SampleLibrary({
  onAddImage,
}: {
  onAddImage(sampleId: string): void;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-2.5 gap-y-3.5 narrow:gap-x-1.75 narrow:gap-y-2.5">
      {SAMPLE_ASSETS.map((asset, index) => (
        <button
          key={asset.id}
          className="group rounded-button bg-transparent p-0 text-left"
          onClick={() => onAddImage(asset.id)}
          aria-label={'添加素材 ' + asset.name}
        >
          <div className="relative h-19.25 overflow-hidden rounded-button border border-sample-border compact:h-16.75 narrow:h-13">
            <img
              src={asset.src}
              alt={asset.name}
              className="h-full w-full object-cover transition-transform duration-300 ease-[ease] group-hover:scale-108"
            />
            <span className="absolute bottom-1.5 right-1.5 grid size-6.25 place-items-center rounded-field border border-glass-border bg-sample-overlay backdrop-blur-[6px]">
              <Plus size={16} />
            </span>
          </div>
          <strong className="mx-0.5 mb-0.75 mt-1.75 block text-[10px] font-medium">
            {asset.name}
          </strong>
          <small className="ml-0.5 text-[9px] text-sample-muted narrow:text-[8px]">
            {descriptions[index]}
          </small>
        </button>
      ))}
    </div>
  );
}
