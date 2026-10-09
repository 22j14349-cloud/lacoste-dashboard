#!/usr/bin/env python3
"""Review tools for a rendered reel. You can't watch or hear the result, so these turn it into
images and numbers you can inspect (Read the PNGs it writes).

  review.py sheet   VIDEO OUT.png [--every 30] [--cols 6] [--width 480]   contact sheet, one frame every N
  review.py strips  VIDEO OUT.png --frames 112,204,450 [--span 8]         consecutive frames around each cut
  review.py stills  DIR OUT.png [--cols 3]                                tile PNG stills from render.mjs
  review.py frames  VIDEO OUT.png --frames 700,712,722 [--cols 3]         specific frames, larger
  review.py crop    IMAGE OUT.png X Y W H                                  full-res detail crop
  review.py loudness AUDIO_OR_VIDEO                                       integrated LUFS / LRA / true peak only
  review.py audiovis AUDIO OUT.png                                        waveform + log spectrogram
  review.py color   VIDEO FRAME X Y [#RRGGBB]                             decoded colour of an 8x8 patch
  review.py probe   VIDEO                                                 duration, frames, fps, size, codecs
"""
import argparse
import glob
import json
import os
import re
import subprocess
import sys


def ff(*args, capture=False):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *args], capture_output=True)
    if r.returncode != 0:
        sys.exit(r.stderr.decode()[-2000:])
    return r.stdout


def tile(n, cols):
    return f'{cols}x{max(1, -(-n // cols))}'


def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest='cmd', required=True)
    a = sub.add_parser('sheet'); a.add_argument('video'); a.add_argument('out'); a.add_argument('--every', type=int, default=30); a.add_argument('--cols', type=int, default=6); a.add_argument('--width', type=int, default=480)
    a = sub.add_parser('strips'); a.add_argument('video'); a.add_argument('out'); a.add_argument('--frames', required=True); a.add_argument('--span', type=int, default=8); a.add_argument('--width', type=int, default=480)
    a = sub.add_parser('stills'); a.add_argument('dir'); a.add_argument('out'); a.add_argument('--cols', type=int, default=3); a.add_argument('--width', type=int, default=640)
    a = sub.add_parser('frames'); a.add_argument('video'); a.add_argument('out'); a.add_argument('--frames', required=True); a.add_argument('--cols', type=int, default=3); a.add_argument('--width', type=int, default=960)
    a = sub.add_parser('crop'); a.add_argument('image'); a.add_argument('out'); [a.add_argument(k, type=int) for k in ('x', 'y', 'w', 'h')]
    a = sub.add_parser('loudness'); a.add_argument('media')
    a = sub.add_parser('audiovis'); a.add_argument('audio'); a.add_argument('out')
    a = sub.add_parser('color'); a.add_argument('video'); a.add_argument('frame', type=int); a.add_argument('x', type=int); a.add_argument('y', type=int); a.add_argument('expect', nargs='?')
    a = sub.add_parser('probe'); a.add_argument('video')
    o = p.parse_args()

    if o.cmd == 'sheet':
        n = int(probe(o.video)['frames']) // o.every + 1
        ff('-i', o.video, '-vf', f"select='not(mod(n\\,{o.every}))',scale={o.width}:-2,tile={tile(n, o.cols)}:padding=4:color=gray", '-frames:v', '1', '-fps_mode', 'passthrough', o.out)
    elif o.cmd == 'strips':
        rows = []
        for i, c in enumerate(int(x) for x in o.frames.split(',')):
            s = max(0, c - o.span // 2)
            row = f'{o.out}.row{i}.png'
            ff('-i', o.video, '-vf', f"select='between(n\\,{s}\\,{s + o.span - 1})',scale={o.width}:-2,tile={o.span}x1:padding=2:color=gray", '-frames:v', '1', '-fps_mode', 'passthrough', row)
            rows.append(row)
        if len(rows) == 1:
            os.replace(rows[0], o.out)
        else:
            ff(*sum((['-i', r] for r in rows), []), '-filter_complex', f'vstack=inputs={len(rows)}', o.out)
            [os.remove(r) for r in rows]
    elif o.cmd == 'stills':
        files = sorted(glob.glob(os.path.join(o.dir, '*.png')))
        files = [f for f in files if not os.path.basename(f).startswith('sheet')]
        ff('-pattern_type', 'glob', '-i', os.path.join(o.dir, 'still_*.png'), '-vf', f'scale={o.width}:-2,tile={tile(len(files), o.cols)}:padding=4:color=gray', '-frames:v', '1', o.out)
    elif o.cmd == 'frames':
        fr = [int(x) for x in o.frames.split(',')]
        sel = '+'.join(f'eq(n\\,{f})' for f in fr)
        ff('-i', o.video, '-vf', f"select='{sel}',scale={o.width}:-2,tile={tile(len(fr), o.cols)}:padding=3:color=gray", '-frames:v', '1', '-fps_mode', 'passthrough', o.out)
    elif o.cmd == 'crop':
        ff('-i', o.image, '-vf', f'crop={o.w}:{o.h}:{o.x}:{o.y}', o.out)
    elif o.cmd == 'loudness':
        r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', o.media, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True)
        summary = r.stderr[r.stderr.rfind('Summary:'):]
        for key in ('I', 'LRA', 'Peak'):
            m = re.search(rf'^\s+{key}:\s+(.*)$', summary, re.M)
            print(f'{key:5s}', m.group(1).strip() if m else '?')
        print('targets: I -16..-13 LUFS for web, true peak <= -1 dBFS, LRA 3-8 LU for a short punchy piece')
    elif o.cmd == 'audiovis':
        ff('-i', o.audio, '-filter_complex', '[0:a]showwavespic=s=1920x260:colors=#E8613C,format=rgba[w];'
           '[0:a]showspectrumpic=s=1920x400:legend=0:scale=log:fscale=log,format=rgba[s];[w][s]vstack', '-frames:v', '1', o.out)
    elif o.cmd == 'color':
        raw = ff('-i', o.video, '-vf', f"select='eq(n\\,{o.frame})',crop=8:8:{o.x}:{o.y}", '-frames:v', '1', '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-', capture=True)
        px = [sum(raw[i::3]) // 64 for i in range(3)]
        got = '#%02X%02X%02X' % tuple(px)
        msg = f'frame {o.frame} @({o.x},{o.y}): {got}'
        if o.expect:
            e = [int(o.expect.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)]
            msg += f'  expected {o.expect}  max channel error {max(abs(a - b) for a, b in zip(px, e))} (<=3 is fine; sample away from vignettes/grain hot spots)'
        print(msg)
    elif o.cmd == 'probe':
        print(json.dumps(probe(o.video), indent=1))


def probe(video):
    r = subprocess.run(['ffprobe', '-v', 'error', '-count_packets', '-show_entries',
                        'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,nb_read_packets',
                        '-of', 'json', video], capture_output=True, text=True)
    j = json.loads(r.stdout)
    v = next(s for s in j['streams'] if s['codec_type'] == 'video')
    a = next((s for s in j['streams'] if s['codec_type'] == 'audio'), None)
    return {'duration': float(j['format']['duration']), 'size_mb': round(int(j['format']['size']) / 1e6, 2),
            'video': f"{v['codec_name']} {v['width']}x{v['height']} @ {v['r_frame_rate']}", 'frames': v.get('nb_read_packets'),
            'audio': a['codec_name'] if a else None}


if __name__ == '__main__':
    main()
