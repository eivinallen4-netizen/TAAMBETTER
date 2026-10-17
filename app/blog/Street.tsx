import Image from 'next/image';
import { TOWER_WIDTH } from './tower-size';

const art = (name: string) => `/blog/art/${name}.webp`;

/** Render scale for the street art, so props read at the tower's size. */
const S = 0.35;
/** The 290x111 sidewalk tile repeats edge to edge; its top line sits 3px down, 8px thick. */
const STRIP_H = 111 * S;
const SIDEWALK_TOP = 3 * S;
const SIDEWALK_LINE = 8 * S;

/** Prop art cut from the street drawing: [file, width, height]. */
const PROPS = {
  lamp: ['prop-lamp', 268, 428],
  hydrant: ['prop-hydrant-v2', 172, 166],
  bush: ['prop-bush-v2', 212, 108],
} as const;

function Prop({ name }: { name: keyof typeof PROPS }) {
  const [file, w, h] = PROPS[name];
  return (
    <Image
      src={art(file)}
      alt=""
      width={w}
      height={h}
      sizes={`${Math.round(w * S)}px`}
      className="block shrink-0 max-w-none"
      style={{ width: w * S, height: h * S }}
    />
  );
}

/**
 * Full-bleed street that closes the article: a sidewalk running the width of the page, with street
 * props along it and a gap in the right column where the tower's front door stands.
 */
export default function Street() {
  return (
    <div
      aria-hidden="true"
      className="relative select-none pointer-events-none"
      style={{ height: STRIP_H, marginTop: -(SIDEWALK_TOP + SIDEWALK_LINE) }}
    >
      <div
        className="absolute inset-y-0 left-1/2 w-screen -translate-x-1/2"
        style={{
          backgroundImage: `url(${art('street')})`,
          backgroundSize: `${290 * S}px ${STRIP_H}px`,
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'center top',
        }}
      />
      {/* Props stand on the sidewalk's top line. */}
      <div className="absolute inset-x-0 grid lg:grid-cols-12 gap-x-16 items-end" style={{ bottom: STRIP_H - SIDEWALK_TOP - 1 }}>
        <div className="lg:col-span-7 flex items-end justify-between px-4">
          <Prop name="lamp" />
          <Prop name="bush" />
          <span className="flex items-end gap-2">
            <Prop name="hydrant" />
            <Prop name="bush" />
          </span>
          <span className="hidden sm:block">
            <Prop name="bush" />
          </span>
        </div>
        <div className="hidden lg:flex lg:col-span-5 justify-center items-end gap-6">
          <Prop name="lamp" />
          <span className="shrink-0" style={{ width: TOWER_WIDTH }} />
          <span className="flex items-end gap-2">
            <Prop name="hydrant" />
            <Prop name="bush" />
          </span>
        </div>
      </div>
    </div>
  );
}
