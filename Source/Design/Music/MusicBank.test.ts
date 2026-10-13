// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { installFakeAudio, type FakeAudio } from '../Sounds/FakeAudio';
import { MusicNames } from './MusicBank';

let fake: FakeAudio;

beforeEach(() => {
  vi.resetModules();
  // A fresh bank reads its starting choice from storage, so one test's mute would
  // otherwise greet the next.
  localStorage.clear();
  fake = installFakeAudio();
});

/** A fresh music bank per test, so decoded tracks are not carried over. The switch comes along,
 * since it is what owns the loudness these tests are about. */
async function freshBank() {
  const bank = await import('./MusicBank');
  return { ...bank, ...(await import('./MusicBus')), ...(await import('./MusicToggle')) };
}

/** happy-dom holds `document.hidden` as a getter, so the tab is posed by standing in for it. */
function poseTab(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('Music preloading', () => {
  it('decodes the tracks up front, so the first scene asking for one is not waiting', async () => {
    const { preloadMusic } = await freshBank();
    await preloadMusic();
    expect(fake.decoded.length).toBe(MusicNames.length);
  });

  it('fetches each track once, however many callers ask at once', async () => {
    const { preloadMusic } = await freshBank();
    await Promise.all([preloadMusic(), preloadMusic()]);
    expect(fake.fetched.length).toBe(MusicNames.length);
  });

  it('leaves the tracks already decoded alone', async () => {
    const { preloadMusic } = await freshBank();
    await preloadMusic();
    await preloadMusic();
    expect(fake.decoded.length).toBe(MusicNames.length);
  });
});

describe('Music playback', () => {
  it('starts the track that was asked for, once it is held', async () => {
    const { preloadMusic, playMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    expect(fake.sounded.length).toBe(1);
    expect(fake.sounded[0].started).toBe(true);
  });

  it('plays it through rather than to the end of the file', async () => {
    // A track that stopped at its own end left a room playing nothing until
    // somebody re-rendered, which is most of a round.
    const { preloadMusic, playMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    expect(fake.sounded[0].loop).toBe(true);
  });

  it('starts a track that beat its own load, once the decode lands', async () => {
    const { playMusic } = await freshBank();
    playMusic('Game');
    expect(fake.sounded.length).toBe(0);
    await vi.waitFor(() => expect(fake.sounded.length).toBe(1));
  });

  it('changes nothing when asked for the track already sounding', async () => {
    // A re-render arrives every frame, and a fade into itself would be a
    // dip in the music rather than no change at all.
    const { preloadMusic, playMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    playMusic('Menu');
    playMusic('Menu');
    expect(fake.sounded.length).toBe(1);
  });

  it('plays a track that will not load without throwing', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    const { preloadMusic, playMusic } = await freshBank();
    await preloadMusic();
    expect(() => playMusic('Menu')).not.toThrow();
    expect(fake.sounded.length).toBe(0);
  });

  it('stays silent rather than throwing where there is no Web Audio at all', async () => {
    vi.stubGlobal('AudioContext', undefined);
    const { preloadMusic, playMusic, stopMusic } = await freshBank();
    await preloadMusic();
    expect(() => playMusic('Menu')).not.toThrow();
    expect(() => stopMusic()).not.toThrow();
    expect(fake.sounded.length).toBe(0);
  });
});

describe('Music changing track', () => {
  it('fades the new one up rather than cutting straight to it', async () => {
    const { preloadMusic, playMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    // The bus, then the hold, then the track's fader, then its duck.
    const [, , menu] = fake.levels;
    expect(menu.value).toBe(0);
    expect(menu.ramps).toEqual([{ from: 0, to: expect.any(Number), at: 1.5 }]);
  });

  it('brings the two tracks to different levels, since they are recorded differently', async () => {
    const { preloadMusic, playMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    playMusic('Game');
    const [, , menu, , game] = fake.levels;
    expect(game.ramps[0].to).not.toBe(menu.ramps[0].to);
  });

  it('fades the old one out over the same second and a half', async () => {
    const { preloadMusic, playMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    playMusic('Game');
    // The old fader was on its way up when the room asked for another track,
    // so what matters is where it was sent last.
    const menuFader = fake.levels[2];
    const last = menuFader.ramps[menuFader.ramps.length - 1];
    expect(last).toEqual({ from: 0, to: 0, at: 1.5 });
  });

  it('holds the old track until the fade has finished, then lets it go', async () => {
    // Stopped at once it would be a cut under the new one rather than a
    // crossfade, and the silence would be heard under the track coming in.
    const { preloadMusic, playMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    playMusic('Game');
    expect(fake.sounded[0].stoppedAt).toEqual([1.5]);
    expect(fake.sounded[1].stoppedAt).toEqual([]);
  });

  it('takes the old track off the graph once it has ended', async () => {
    // A looping node that is never disconnected keeps the whole page's audio
    // graph alive for as long as the room is open.
    const { preloadMusic, playMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    playMusic('Game');
    expect(fake.sounded[0].cleanedUp).toBe(true);
  });

  it('takes the handover as long as it is given, so a fade can finish with a transition', async () => {
    // Under the splash the new track has to be up by the time the room is,
    // which is a shorter fade than a change made in the open.
    const { preloadMusic, playMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    playMusic('Game', 0.75);
    expect(fake.sounded[0].stoppedAt).toEqual([0.75]);
    const incoming = fake.levels[4];
    expect(incoming.ramps[incoming.ramps.length - 1].at).toBe(0.75);
  });

  it('fades the room out of the music when the screen asking for it goes', async () => {
    const { preloadMusic, playMusic, stopMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    stopMusic();
    expect(fake.levels[2].ramps[1]).toEqual({ from: 0, to: 0, at: 1.5 });
    expect(fake.sounded[0].stoppedAt).toEqual([1.5]);
  });

  it('lets the room hear something again afterwards', async () => {
    const { preloadMusic, playMusic, stopMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    stopMusic();
    playMusic('Game');
    expect(fake.sounded.length).toBe(2);
    expect(fake.sounded[1].stoppedAt).toEqual([]);
  });
});

describe('Music ducked for the count-in', () => {
  it('goes quiet for the count rather than stopping, since the lobby is still the room', async () => {
    const { preloadMusic, playMusic, duckMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    duckMusic(true);
    const duck = fake.levels[3];
    expect(duck.ramps[duck.ramps.length - 1]).toEqual({ from: 1, to: 0, at: 0.4 });
    expect(fake.sounded[0].stoppedAt).toEqual([]);
  });

  it('comes back forward once the count is over', async () => {
    const { preloadMusic, playMusic, duckMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    duckMusic(true);
    duckMusic(false);
    const duck = fake.levels[3];
    expect(duck.ramps[duck.ramps.length - 1].to).toBe(1);
  });

  it('brings a track in already open, since the handover is what brings it in', async () => {
    // A track made quiet and then opened again would fade up twice over, and
    // the crossfade it is arriving under would not be the fade anybody heard.
    const { preloadMusic, playMusic, duckMusic } = await freshBank();
    await preloadMusic();
    duckMusic(true);
    playMusic('Menu');
    expect(fake.levels[3].value).toBe(1);
  });

  it('does not swell the lobby track when the room hands over, since the duck is per track', async () => {
    // The duck is let go as the track changes. On a shared gain that would bring
    // the lobby track back up under its own crossfade out, which is the lobby
    // music returning just as the room leaves it.
    const { preloadMusic, playMusic, duckMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    duckMusic(true);
    playMusic('Game');
    duckMusic(false);
    const leaving = fake.levels[3];
    const arriving = fake.levels[5];
    expect(leaving.ramps[leaving.ramps.length - 1].to).toBe(0);
    expect(arriving.value).toBe(1);
  });

  it('leaves a held room silent, since the two are separate facts about one bus', async () => {
    // Two writers on one gain would fight: letting go of a held room mid-count
    // would bring the track back forward at the same moment it steps back.
    const { preloadMusic, playMusic, duckMusic, holdMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    duckMusic(true);
    holdMusic(true);
    expect(fake.levels[3].ramps[fake.levels[3].ramps.length - 1].to).toBe(0);
    expect(fake.levels[1].ramps[fake.levels[1].ramps.length - 1].to).toBe(0);
  });
});

describe('Music held', () => {
  it('takes the music out of hearing, without stopping the track', async () => {
    // A track stopped and started again comes back at its first second, so a
    // held room would hear the same bar twice when it was let go.
    const { preloadMusic, playMusic, holdMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    holdMusic(true);
    expect(fake.levels[1].ramps[fake.levels[1].ramps.length - 1]).toEqual({
      from: 1,
      to: 0,
      at: 0.3,
    });
    expect(fake.sounded[0].stoppedAt).toEqual([]);
  });

  it('puts it back where it was when the room is let go', async () => {
    const { preloadMusic, playMusic, holdMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    holdMusic(true);
    holdMusic(false);
    // Where it started from is the ramp's own business: the fake clock never
    // moves, so what is checked is where the hold was sent and when.
    expect(fake.levels[1].ramps[fake.levels[1].ramps.length - 1].to).toBe(1);
  });

  it('leaves the one track alone through the whole hold, so nothing has to be caught up', async () => {
    const { preloadMusic, playMusic, holdMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    holdMusic(true);
    holdMusic(false);
    expect(fake.sounded.length).toBe(1);
    expect(fake.sounded[0].stoppedAt).toEqual([]);
  });

  it('starts a track asked for under a hold silently rather than after it', async () => {
    // Held first, playing second: a track made at full level and faded down
    // afterwards is heard arriving and then leaving, which is not a hold.
    const { preloadMusic, playMusic, holdMusic } = await freshBank();
    await preloadMusic();
    holdMusic(true);
    playMusic('Menu');
    expect(fake.levels[1].value).toBe(0);
  });

  it('does nothing at all where no track has been asked for yet', async () => {
    const { holdMusic } = await freshBank();
    expect(() => holdMusic(true)).not.toThrow();
    expect(fake.levels.length).toBe(0);
  });
});

describe('Music switched', () => {
  it('is on by default, since music nobody asked to stop is not off', async () => {
    const { isMusicOff } = await freshBank();
    expect(isMusicOff()).toBe(false);
  });

  it('cuts only the music, leaving the room sounds where they were', async () => {
    // Two switches rather than one master: somebody playing with the presses
    // quiet still wants the track, and vice versa.
    const { preloadMusic, playMusic, setMusicOff } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    const [bus] = fake.levels;
    setMusicOff(true);
    expect(bus.value).toBe(0);
  });

  it('brings it back', async () => {
    const { preloadMusic, playMusic, setMusicOff } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    const [bus] = fake.levels;
    setMusicOff(true);
    setMusicOff(false);
    expect(bus.value).toBe(1);
  });

  it('remembers the choice until anything has asked for a track', async () => {
    const { setMusicOff, preloadMusic, playMusic } = await freshBank();
    setMusicOff(true);
    await preloadMusic();
    playMusic('Menu');
    expect(fake.levels[0].value).toBe(0);
  });

  it('comes back quiet after a reload', async () => {
    const { setMusicOff } = await freshBank();
    setMusicOff(true);
    const reloaded = await freshBank();
    await reloaded.preloadMusic();
    reloaded.playMusic('Menu');
    expect(reloaded.isMusicOff()).toBe(true);
    expect(fake.levels[0].value).toBe(0);
  });

  it('comes back heard after a reload when it was on', async () => {
    const { setMusicOff } = await freshBank();
    setMusicOff(true);
    setMusicOff(false);
    const reloaded = await freshBank();
    expect(reloaded.isMusicOff()).toBe(false);
  });

  it('goes quiet while the tab is in the background', async () => {
    const { preloadMusic, playMusic } = await freshBank();
    await preloadMusic();
    playMusic('Menu');
    const [bus] = fake.levels;
    expect(bus.value).toBe(1);
    poseTab(true);
    expect(bus.value).toBe(0);
    poseTab(false);
    expect(bus.value).toBe(1);
  });
});
