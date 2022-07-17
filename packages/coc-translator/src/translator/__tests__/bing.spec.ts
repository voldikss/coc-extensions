import { BingTranslator } from '../providers/bing'

it('test bing translate engine', async () => {
  const bingTranslator = new BingTranslator()
  const result = await bingTranslator.translate({
    text: 'good',
    targetLang: 'zh-CN',
  })
  console.log(result)
})
