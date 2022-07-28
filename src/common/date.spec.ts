import * as utilsDate from './date';

describe('utils-date', () => {
  it('dateFormat', () => {
    expect(utilsDate.dateFormat('yyyy').length).toEqual(4);

    const list = [
      ['', '1649211013915', '1649211013915'],
      ['yyyy-MM-dd', '1649211013915', '2022-04-06'],
      ['yyyy-MM-dd hh:mm:ss.S', new Date('2022-04-06T10:10:13.915'), '2022-04-06 10:10:13.915'],
    ] as const;

    for (const [fmt, d, r] of list) {
      expect(utilsDate.dateFormat(fmt, d)).toEqual(r);
    }
  });

  it('arriveTimerFormat', () => {
    const list = [
      [123, [0, 0, 2, 3, '00:02:03']],
      [1_521_580, [17, 14, 39, 40, '17day 14:39:40']],
      [0, [0, 0, 0, 0, '00:00:00']],
      [86_400, [1, 0, 0, 0, '1day 00:00:00']],
    ] as const;

    for (const [sec, r] of list) {
      expect(utilsDate.arriveTimerFormat(sec)).toEqual(r);
    }

    expect(utilsDate.arriveTimerFormat(86_400, '天')).toEqual([1, 0, 0, 0, '1天00:00:00']);
  });

  it('formatTimeCost', () => {
    expect(+utilsDate.formatTimeCost(0).split('days')[0] > 19_200).toBeTruthy();
    expect(utilsDate.formatTimeCost(Date.now()).length <= 1).toBeTruthy();
    expect(utilsDate.formatTimeCost(Date.now() - 1000) === '1s').toBeTruthy();
    expect(utilsDate.formatTimeCost(Date.now() - 1001).includes('1s')).toBeTruthy();
    expect(utilsDate.formatTimeCost(Date.now() - 1001, ['日', '小时', '分钟', '秒', '毫秒']).includes('毫秒')).toBeTruthy();
    // suffix 对应位置为 null 则不显示
    expect(utilsDate.formatTimeCost(Date.now() - 1011, ['日', '小时', '分钟', '秒', null]) === '1秒').toBeTruthy();
  });

  it('yyyyMMddFormat', () => {
    const list = [
      ['20180101', '2018年01月01日'],
      ['20190419000000000', '2019年04月19日'],
    ] as const;

    for (const [str, r] of list) {
      expect(utilsDate.yyyyMMddFormat(str).dateStr()).toEqual(r);
    }
  });

  const utcTimestamp = new Date('2022-04-06T10:10:13.915').getTime() + new Date().getTimezoneOffset() * 60_000;
  it('getDateTimeByTimeZone', () => {
    const list = [
      [8, new Date('2022-04-06T10:10:13.915'), utcTimestamp + 8 * 3_600_000],
      [-8, new Date('2022-04-06T10:10:13.915'), utcTimestamp - 8 * 3_600_000],
      [0, new Date('2022-04-06T10:10:13.915'), utcTimestamp],
    ] as const;

    for (const [timeZone, now, r] of list) {
      const result = utilsDate.getDateTimeByTimeZone(timeZone, now).getTime();
      if (result !== r) console.error('getDateTimeByTimeZone-error:', timeZone, now, r, result);
      expect(result).toEqual(r);
    }
  });

  it('toLocalTime', () => {
    const utcTimestamp2 = new Date('2022-04-06T00:00:00').getTime() + new Date().getTimezoneOffset() * 60_000;
    const list = [
      [new Date('2022-04-06T10:10:13.915'), 8, utcTimestamp + 8 * 3_600_000],
      [new Date('2022-04-06T10:10:13.915'), 0, utcTimestamp],
      ['20220406', 8, utcTimestamp2 + 8 * 3_600_000],
      ['20220406', 0, utcTimestamp2 + 0 * 3_600_000],
    ] as const;

    for (const [now, timeZone, r] of list) {
      const result = utilsDate.toLocalTime(now, timeZone).getTime();
      if (result !== r) console.error('toLocalTime-error:', timeZone, now, r, result);
      expect(result).toEqual(r);
    }
  });

  it('getCostTime', () => {
    const list = [
      ['20220406', '20220407', 86_400_000],
      ['20220406102004', '20220406102004', 0],
      ['20220406102004560', '20220406103005559', 600_999],
    ] as const;

    for (const [start, end, r] of list) {
      expect(utilsDate.getCostTime(end, start)).toEqual(r);
    }
  });

  it('formatIntToTime', () => {
    const list = [
      ['140151', '14:01:51'],
      ['140151559', '14:01:51.559'],
      [80_151, '08:01:51'],
      [80_151_559, '08:01:51.559'],
    ] as const;

    for (const [time, r] of list) {
      expect(utilsDate.formatIntToTime(time)).toEqual(r);
    }

    expect(utilsDate.formatIntToTime(80_151_559, false)).toEqual('08:01:51');
  });
});
