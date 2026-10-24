import { latestOnly, type LoadState } from '../use-foreground-refresh';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('latestOnly', () => {
  it('ignores an older run that finishes after a newer one', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const load = jest
      .fn<Promise<string>, []>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const reports: LoadState<string>[] = [];
    const loader = latestOnly(load, (state) => reports.push(state));

    loader.run();
    loader.run();
    second.resolve('new');
    await flush();
    first.resolve('old');
    await flush();

    expect(reports).toEqual([{ status: 'done', value: 'new' }]);
  });

  it('reports an error instead of loading forever', async () => {
    const reports: LoadState<string>[] = [];
    const loader = latestOnly(
      () => Promise.reject(new Error('boom')),
      (state) => reports.push(state),
    );

    loader.run();
    await flush();

    expect(reports).toEqual([{ status: 'error' }]);
  });

  it('reports nothing after cancel', async () => {
    const run = deferred<string>();
    const reports: LoadState<string>[] = [];
    const loader = latestOnly(
      () => run.promise,
      (state) => reports.push(state),
    );

    loader.run();
    loader.cancel();
    run.resolve('late');
    await flush();

    expect(reports).toEqual([]);
  });
});
