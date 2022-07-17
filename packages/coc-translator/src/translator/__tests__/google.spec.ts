import { GoogleTranslator } from '../providers/google'

it('test google translate engine', async () => {
  const googleTranslator = new GoogleTranslator()
  const result = await googleTranslator.translate({
    text: 'good',
    targetLang: 'zh-CN',
  })
  console.log(result)
})
