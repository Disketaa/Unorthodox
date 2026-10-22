import { watchConnection } from './ConnectionWatch';

const Base = typeof RTCPeerConnection !== 'undefined' ? RTCPeerConnection : Object;

function callMethod(obj: object, method: string, ...args: unknown[]): unknown {
  const fn = Reflect.get(obj, method);
  if (typeof fn !== 'function') return undefined;
  return fn.apply(obj, args);
}

/** Workaround for trystero 0.25.4 issue #204: stale offers carry no ICE candidates. */
export class KeepPristineOffer extends Base {
  static generateCertificate(keygenAlgorithm: AlgorithmIdentifier): Promise<RTCCertificate> {
    return RTCPeerConnection.generateCertificate(keygenAlgorithm);
  }
  constructor(config?: RTCConfiguration) {
    super(config);
    if (typeof RTCPeerConnection === 'undefined') return;
    watchConnection(this);
    const pristine = () => {
      const remote = Reflect.get(this, 'remoteDescription');
      const local = Reflect.get(this, 'localDescription');
      return remote === null || remote === undefined
        ? false
        : Reflect.get(local ?? {}, 'type') === 'offer';
    };
    let skip = false;
    const setLocal = Reflect.get(this, 'setLocalDescription');
    const create = Reflect.get(this, 'createOffer');
    const restart = Reflect.get(this, 'restartIce');
    Reflect.set(this, 'setLocalDescription', async (description: RTCSessionDescriptionInit) => {
      if (description?.type === 'rollback' && pristine()) return void (skip = true);
      if (skip && description?.type === 'offer') return void (skip = false);
      skip = false;
      if (typeof setLocal === 'function') return setLocal.apply(this, [description]);
    });
    Reflect.set(this, 'restartIce', () => {
      if (!skip && typeof restart === 'function') restart.apply(this);
    });
    const override = (options?: RTCOfferOptions) => {
      const local = Reflect.get(this, 'localDescription');
      return skip && local
        ? Promise.resolve(callMethod(local, 'toJSON'))
        : typeof create === 'function'
          ? create.apply(this, [options])
          : Promise.reject(new Error('createOffer unavailable'));
    };
    Object.defineProperty(this, 'createOffer', { value: override, writable: true });
  }
}
