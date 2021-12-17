import { YoudaoTranslator } from '../providers/youdao'

it('test youdao translate engine', async () => {
  const googleTranslator = new YoudaoTranslator()
  const result = await googleTranslator.translate({
    text: 'good',
    targetLang: 'zh-CN',
  })
  console.log(result)
})
