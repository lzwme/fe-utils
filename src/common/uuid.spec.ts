import * as comm from './uuid';

describe('utils/common', () => {
  it('isUUID', () => {
    for (const uid of ['d5aeb3d8-8dd6-4ffc-bbe2-89982ca00000', '00000000-0000-0000-0000-000000000000']) {
      expect(comm.isUUID(uid)).toBeTruthy();
    }
    for (const uid of [null, 0, undefined, 'd5aeb3d8-8dd6-4ffc-bbe2-89982ca0000', '0000000-0000-0000-0000-000000000000']) {
      expect(comm.isUUID(uid as never)).toBeFalsy();
    }
  });

  it('v1', () => {
    expect(comm.v1()).not.toEqual(comm.v1());
    expect(comm.v1().length).toBe(36);
    expect(comm.v1()[8]).toBe('-');
  });

  it('formatToUuid', () => {
    expect(comm.formatToUuid(null as never).length).toBe(0);
    expect(comm.formatToUuid('').length).toBe(0);
    expect(comm.formatToUuid('abc').length).toBe(0);
    expect(comm.formatToUuid('d5aeb3d88dd64ffcbbe289982ca00000')[0].length).toBe(36);
    expect(comm.isUUID(comm.formatToUuid('d5aeb3d88dd64ffcbbe289982ca00000')[0])).toBeTruthy();
    expect(comm.formatToUuid('d5aeb3d8-8dd6-4ffc-bbe2-89982ca00000')[0].length).toBe(36);
  });
});
