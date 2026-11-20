import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';

import { bindTemplate, visibleText } from '../../../client/src/templates/ngo/engine/mapping.ts';
import { normalizeEvent } from '../../../client/src/templates/event/kit/data.ts';
import { getEventDemoData, getMinimalEventData } from '../../../client/src/templates/event/demos/demoData.ts';
import { normalizeNgo } from '../../../client/src/templates/ngo/kit/data.ts';
import { getNgoDemoData } from '../../../client/src/templates/ngo/demos/demoData.ts';

const parse = (html: string) => parseHTML(html).document as unknown as Document;
const page = '<!doctype html><html><head><title>t</title></head><body><main><p id="a">x</p><p id="b">y</p><ul id="l"><li><span class="n">n</span></li></ul></main></body></html>';
const bind = (rules: unknown[], view: Record<string, unknown> = {}) =>
  visibleText(bindTemplate(page, { version: 1, rules } as never, { primary: '', accent: '', ...view } as never, parse), parse);

describe('shared mapping engine: value expressions that have a missing part', () => {
  test('a complete expression is kept as written', () => {
    assert.match(bind([{ sel: '#a', text: '{city} · {date}' }], { city: 'Leeds', date: '8 Oct' }), /Leeds · 8 Oct/);
  });

  test('a dangling separator is trimmed when one part is missing', () => {
    const t = bind([{ sel: '#a', text: '{city} · {date}' }], { city: 'Leeds', date: '' });
    assert.match(t, /Leeds/);
    assert.ok(!/Leeds\s*·/.test(t), `separator left behind: ${t}`);
    const u = bind([{ sel: '#a', text: '{city} · {date}' }], { city: '', date: '8 Oct' });
    assert.ok(!/·\s*8 Oct/.test(u) && /8 Oct/.test(u), `leading separator left behind: ${u}`);
  });

  test('empty brackets and doubled separators are removed', () => {
    const t = bind([{ sel: '#a', text: '[{edition}]' }, { sel: '#b', text: '{a} · {b} · {c}' }], { edition: '', a: 'A', b: '', c: 'C' });
    assert.ok(!/\[\s*\]/.test(t), `empty brackets kept: ${t}`);
    assert.ok(!/·\s*·/.test(t), `doubled separator kept: ${t}`);
    assert.match(t, /A · C/);
  });

  test('brackets around a present value are left alone', () => {
    assert.match(bind([{ sel: '#a', text: '[{edition}]' }], { edition: '3rd' }), /\[3rd\]/);
  });

  test('an expression with every part missing removes the element rather than leaving punctuation', () => {
    const html = bindTemplate(page, { version: 1, rules: [{ sel: '#a', text: '{x} · {y}' }] } as never, { primary: '', accent: '' } as never, parse);
    assert.ok(!/id="a"/.test(html), 'empty element kept');
  });
});

describe('event view: venue and people helpers', () => {
  const view = normalizeEvent({ eventData: getEventDemoData('festival_concert'), requirements: {}, isDemo: true } as never, 'http://localhost');

  test('venueFull joins every venue part the organiser gave', () => {
    assert.equal(view.venueFull, 'The Meadow, 1 Mill Lane, Sampleton, Exampleland');
  });

  test('venueFull is empty when no venue part was given', () => {
    const v = normalizeEvent({ eventData: getMinimalEventData('festival_concert'), requirements: {}, isDemo: false } as never, 'http://localhost');
    assert.equal(v.venueFull, '');
  });

  test('a person name is split into first word and rest, and a one-word name has no rest', () => {
    const marlow = view.speakers.find((s) => s.name === 'Marlow Fox')!;
    assert.equal(marlow.first, 'Marlow');
    assert.equal(marlow.rest, 'Fox');
    const lanterns = view.speakers.find((s) => s.name === 'Lanterns')!;
    assert.equal(lanterns.first, 'Lanterns');
    assert.equal(lanterns.rest, '');
  });

  test('a person with a three-part name keeps the rest in one string', () => {
    const d = getEventDemoData('festival_concert');
    d.speakers[0].name = 'Mary Ann Smith';
    const v = normalizeEvent({ eventData: d, requirements: {}, isDemo: true } as never, 'http://localhost');
    assert.equal(v.speakers[0].first, 'Mary');
    assert.equal(v.speakers[0].rest, 'Ann Smith');
  });
});

describe('ngo view: people name split', () => {
  test('leadership names are split into first word and rest', () => {
    const v = normalizeNgo({ ngoData: getNgoDemoData('grassroots_ngo'), requirements: {}, isDemo: true }, 'http://localhost');
    assert.ok(v.people.length > 0);
    for (const p of v.people) {
      assert.equal(`${p.first}${p.rest ? ' ' + p.rest : ''}`, p.name.replace(/\s+/g, ' ').trim());
    }
  });
});

describe('ngo view: tel link', () => {
  const viewWithPhone = (phone: string) => {
    const d: any = getNgoDemoData('grassroots_ngo');
    d.profile = { ...d.profile, contactPhone: phone };
    return normalizeNgo({ ngoData: d, requirements: {}, isDemo: true }, 'http://localhost');
  };
  test('a phone number with spaces and brackets becomes a clean tel: link', () => {
    assert.equal(viewWithPhone('+44 (0)20 7946 0000').tel, 'tel:+4402079460000');
  });
  test('text that is not a phone number gives no tel link', () => {
    assert.equal(viewWithPhone('call us').tel, '');
    assert.equal(viewWithPhone('').tel, '');
  });
});
