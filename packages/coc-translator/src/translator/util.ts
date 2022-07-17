export function decodeHtmlCharCodes(text: string) {
  return text.replace(/(&#(\d+);)/g, (_match, _capture, charCode) => {
    return String.fromCharCode(charCode)
  })
}

/**
 * 单词分割
 */
export function preProcess(text: string): string {
  const camelRegex = /([a-z])([A-Z])(?=[a-z])/g
  const underlineRegex = /([a-zA-Z])_([a-zA-Z])/g
  return text.trim().replace(camelRegex, '$1 $2').replace(underlineRegex, '$1 $2').toLowerCase()
}
