import { HaiciTranslator } from '../providers/haici'

it('test haici translate engine', async () => {
  const googleTranslator = new HaiciTranslator()
  const result = await googleTranslator.translate({
    text: 'good',
    targetLang: 'zh-CN',
  })
  console.log(result)
})
