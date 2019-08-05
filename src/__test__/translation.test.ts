import { BingTranslator, CibaTranslator, GoogleTranslator } from '../commands/translator'

// test('bing translator', async () => {
//   const bing = new BingTranslator('bing')
//   const translation = await bing.translate('good', 'zh')
//   expect(translation.engine === 'bing').toBe(true)
//   expect(translation.paraphrase === '').toBe(true)
  ///////////// Network problem leads to ci failure
  // expect(translation.explain[0].trim() === 'adv. 好').toBe(true)
  // expect(translation.explain[1].trim() === 'n. 好处；好人；益处；善行').toBe(true)
  // expect(translation.explain[2].trim() === 'adj. 有好处；好的；优质的；符合标准的').toBe(true)
  // expect(translation.phonetic === 'ɡʊd').toBe(true)

// })

test('ciba translator', async () => {
  const bing = new CibaTranslator('ciba')
  const translation = await bing.translate('good', 'zh')
  expect(translation.engine === 'ciba').toBe(true)
  expect(translation.explain[0].trim() === 'adj. 好的;优秀的;有益的;漂亮的，健全的;').toBe(true)
  expect(translation.explain[1].trim() === 'n. 好处，利益;善良;善行;好人;').toBe(true)
  expect(translation.explain[2].trim() === 'adv. 同well;').toBe(true)
  expect(translation.phonetic === 'gʊd').toBe(true)
})

test('google translator', async () => {
  const bing = new GoogleTranslator('google')
  const translation = await bing.translate('google', 'zh')
  expect(translation.engine === 'google').toBe(true)
  expect(translation.paraphrase.trim() === '谷歌').toBe(true)
  expect(translation.explain.length === 0).toBe(true)
})
