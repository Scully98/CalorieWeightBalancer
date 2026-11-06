describe('appGroupFile without the native module (Jest)', () => {
  it('writes nothing and reads null', async () => {
    const { appGroupFile, isProtectedDataAvailable } =
      jest.requireActual<typeof import('../app-group')>('../app-group');
    expect(appGroupFile.write('widget/a.json', '{}')).toBe(false);
    expect(appGroupFile.read('widget/a.json')).toBeNull();
    expect(() => appGroupFile.remove('widget/a.json')).not.toThrow();
    expect(await isProtectedDataAvailable()).toBe(true);
  });
});

describe('appGroupFile with the native module', () => {
  const native = {
    write: jest.fn(() => true),
    read: jest.fn(() => '{"a":1}'),
    remove: jest.fn(),
    isProtectedDataAvailable: jest.fn(async () => false),
  };

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../../modules/widget-file', () => ({ WidgetFile: native }));
  });

  it('passes the App Group, path and contents', async () => {
    const { APP_GROUP, appGroupFile, isProtectedDataAvailable } =
      jest.requireActual<typeof import('../app-group')>('../app-group');
    expect(appGroupFile.write('widget/a.json', '{}')).toBe(true);
    expect(native.write).toHaveBeenCalledWith(APP_GROUP, 'widget/a.json', '{}');
    expect(appGroupFile.read('widget/a.json')).toBe('{"a":1}');
    expect(native.read).toHaveBeenCalledWith(APP_GROUP, 'widget/a.json');
    appGroupFile.remove('widget/a.json');
    expect(native.remove).toHaveBeenCalledWith(APP_GROUP, 'widget/a.json');
    expect(await isProtectedDataAvailable()).toBe(false);
  });
});
